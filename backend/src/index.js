const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const cors = require("cors");
const multer = require("multer");
const { User, Project, Image, Label } = require("./mongodb"); // Import the new models
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");

const JWT_SECRET = "your_jwt_secretthisissecrettrustme"; // Replace with a secure secret key for your JWT

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(express.json());
app.use(cors());
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../templates"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/images", express.static(path.join(__dirname, "public/images")));

const optimizeImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const optimizedFiles = await Promise.all(
    req.files.map(async (file) => {
      const { dir, name } = path.parse(file.path);
      const optimizedPath = path.join(dir, `${name}-optimized.webp`);

      await sharp(file.path)
        .resize(800) // Resize to 800px width
        .webp({ quality: 80 }) // Convert to WebP
        .toFile(optimizedPath);

      return {
        ...file,
        filePath: optimizedPath,
        fileName: file.originalname.replace(/\.\w+$/, ".webp"),
      };
    })
  );

  req.files = optimizedFiles;
  next();
};

const generateLQIP = async (file) => {
  const lqipPath = file.path.replace(/\.\w+$/, "-lqip.webp");
  await sharp(file.path)
    .resize(20) // Very small image size
    .webp({ quality: 10 })
    .toFile(lqipPath);
  return lqipPath;
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./public/images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Extract the original file extension
    // Create a new filename that starts with Date.now()
    const newFilename = `${Date.now()}_${file.originalname}`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check if the Authorization header is provided
  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Extract the token from the 'Bearer <token>' format
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token not provided in the correct format" });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(500).json({ message: "Failed to authenticate token" });
    }

    // Attach user information to the request for use in other routes
    req.userId = decoded.id;
    next();
  });
};

// Get all projects along with associated images
app.get("/projects", verifyToken, async (req, res) => {
  try {
    const projects = await Project.find().populate("images"); // Populates the images field with image details

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

// Export projcet
app.get("/projects/:id/export", verifyToken, async (req, res) => {
  const projectId = req.params.id;
  // Fetch project data from database
  const projectData = await collection.getProjectById(projectId);

  // Send the data as a downloadable file (JSON format here)
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=project_${projectId}_data.json`
  );
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(projectData)); // You can also send CSV, XLSX, etc.
});

// Get a project by ID along with associated images
app.get("/project/:id", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId)
      .populate("labels")
      .populate("images"); // Populates the images field with image details

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({ message: "Error fetching project", error });
  }
});

// Get image by ID
app.get("/image/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id)
      .populate({
        path: "annotations.label",
      })
      .lean();

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Find the project that contains this image
    const project = await Project.findOne({ images: image._id })
      .populate("labels")
      .lean();
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found for this image" });
    }

    // Ensure labels are returned as an array
    const labels = Array.isArray(project.labels)
      ? project.labels
      : [project.labels];

    // Return image and project labels
    res.json({ image, labels });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Error fetching image", error });
  }
});

// Create a new project and associate uploaded images
app.post(
  "/projects",
  verifyToken,
  upload.array("files", 100),
  async (req, res) => {
    try {
      const { name, description, labels } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res
          .status(400)
          .json({ message: "Name and description are required" });
      }

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one image file is required" });
      }

      // Create project
      const project = new Project({ name, description });

      // Save each uploaded image
      const imagePromises = req.files.map((file) => {
        const image = new Image({
          fileName: file.originalname,
          filePath: `images/${encodeURIComponent(file.filename)}`, // Normalize path with forward slashes
        });
        return image.save();
      });

      const images = await Promise.all(imagePromises);

      // Add images to the project
      project.images = images.map((image) => image._id);

      // Handle labels
      const labelArray = Array.isArray(labels) ? labels : [labels];

      // Update labels if provided
      if (labelArray?.length > 0) {
        const labelIds = await Promise.all(
          labelArray.map(async (labelId) => {
            const label = await Label.findById(labelId);
            if (!label) throw new Error(`Label with ID ${labelId} not found`);
            return label._id;
          })
        );
        project.labels = labelIds;
      }

      await project.save();

      res.json({ message: "Project and images saved successfully", project });
    } catch (error) {
      console.error("Upload Error: ", error.message);
      res
        .status(500)
        .json({ message: "Error uploading project", error: error.message });
    }
  }
);

app.post(
  "/project/:id/upload-images",
  verifyToken,
  upload.array("files", 100),
  optimizeImage,
  async (req, res) => {
    const { id } = req.params;

    try {
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const imagePromises = req.files.map(async (file) => {
        const lqipPath = await generateLQIP(file);
        const image = new Image({
          fileName: file.originalname,
          filePath: `images/${encodeURIComponent(file.filename)}`, // Normalize path with forward slashes
          placeholder: lqipPath, // Save LQIP path
        });
        return image.save();
      });

      const images = await Promise.all(imagePromises);

      project.images.push(...images.map((img) => img._id));
      await project.save();

      res.status(201).json({ message: "Images uploaded successfully", images });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Error uploading images", error });
    }
  }
);

app.delete("/projects/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the project
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Optionally, delete associated images
    await Image.deleteMany({ _id: { $in: project.images } });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project", error });
  }
});

// Update an existing project
app.put(
  "/projects/:id",
  verifyToken,
  upload.array("files", 100),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, labels } = req.body;

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      project.name = name || project.name;
      project.description = description || project.description;

      // Handle new images if uploaded
      if (req.files?.length) {
        const newImages = req.files.map((file) => ({
          fileName: file.originalname,
          filePath: `images/${encodeURIComponent(file.filename)}`,
        }));
        const savedImages = await Promise.all(
          newImages.map((img) => new Image(img).save())
        );
        project.images.push(...savedImages.map((img) => img._id));
      }

      // Ensure `labels` is treated as an array
      const labelArray = Array.isArray(labels) ? labels : [labels];

      // Update labels if provided
      if (labelArray?.length > 0) {
        const labelIds = await Promise.all(
          labelArray.map(async (labelId) => {
            const label = await Label.findById(labelId);
            if (!label) throw new Error(`Label with ID ${labelId} not found`);
            return label._id;
          })
        );
        project.labels = labelIds;
      }

      const updatedProject = await project.save();
      res.json({
        message: "Project updated successfully",
        project: updatedProject,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Error updating project", error });
    }
  }
);

app.get("/getUsers", (req, res) => {
  res
    .json(
      UserModel.find({}).then(function (users) {
        res.json(users);
      })
    )
    .catch(function (err) {
      console.log(err);
    });
});

//#region Label

//GET endpoint to get labes

app.get("/labels", verifyToken, async (req, res) => {
  try {
    const labels = await Label.find();

    res.json(labels);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

// POST endpoint to create a label
app.post("/labels", verifyToken, async (req, res) => {
  const { name, color } = req.body;

  try {
    const newLabel = new Label({
      name,
      color,
    });

    const savedLabel = await newLabel.save();
    res.status(201).json(savedLabel);
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ message: "Error creating label", error });
  }
});

app.post("/image/:id/annotations", async (req, res) => {
  const { id } = req.params;
  const { annotations } = req.body;

  try {
    const image = await Image.findByIdAndUpdate(
      id,
      { annotations },
      { new: true }
    ).populate("annotations.label"); // Populate label details

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Annotations saved successfully", image });
  } catch (error) {
    console.error("Error saving annotations:", error);
    res.status(500).json({ message: "Error saving annotations", error });
  }
});

//#endregion

//#region Auth
app.post("/login", async (req, res) => {
  try {
    // Validate request body
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid email or password format" });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .json({ message: "Login successful", token, email: user.email });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ message: "Login failed", error });
  }
});

app.post("/signUp", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Check if the passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//#endregion

app.listen(3001, () => {
  console.log("Server is Running");
});
