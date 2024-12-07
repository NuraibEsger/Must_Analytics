const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const cors = require("cors");
const multer = require("multer");
const { User, Project, Image, Label } = require("./mongodb"); // Import the new models
const fs = require('fs');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "your_jwt_secretthisissecrettrustme"; // Replace with a secure secret key for your JWT


const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
app.use(cors());
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, '../templates'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({storage});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  // Check if the Authorization header is provided
  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Extract the token from the 'Bearer <token>' format
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token not provided in the correct format" });
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
app.get('/projects', verifyToken, async (req, res) => {
  try {
    const projects = await Project.find().populate('images'); // Populates the images field with image details
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});

// Export projcet
app.get("/projects/:id/export", verifyToken, async (req, res) => {
  const projectId = req.params.id;
  // Fetch project data from database
  const projectData = await collection.getProjectById(projectId);

  // Send the data as a downloadable file (JSON format here)
  res.setHeader("Content-Disposition", `attachment; filename=project_${projectId}_data.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(projectData)); // You can also send CSV, XLSX, etc.
});

// Get a project by ID along with associated images
app.get('/project/:id', verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId)
    .populate('labels')
    .populate('images'); // Populates the images field with image details
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Error fetching project', error });
  }
});

// Get image by ID
app.get("/image/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id)
      .populate("annotations.label")
      .lean(); // Use `.lean()` to get plain JSON objects
      
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.json(image);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Error fetching image", error });
  }
});

// Create a new project and associate uploaded images
app.post('/projects', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    const { name, description, labels } = req.body; // Extract labels from body

    // Create project
    const project = new Project({ name, description });
    await project.save();

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
    if (labels && labels.length > 0) {
      const labelIds = await Promise.all(
        labels.map(async (labelId) => {
          const label = await Label.findById(labelId);
          if (!label) {
            throw new Error(`Label with ID ${labelId} not found`);
          }
          return label._id;
        })
      );

      // Add labels to the project
      project.labels = labelIds;
    }

    await project.save();
    
    res.json({ message: 'Project and images saved successfully', project });
  } catch (error) {
    console.error('Upload Error: ', error);
    res.status(500).json({ message: 'Error uploading project', error });
  }
});

app.post('/project/:id/upload-images', verifyToken, upload.array('files', 10), async (req, res) => {
  const { id } = req.params;

  console.log(id);

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Save all uploaded images
    const imagePromises = req.files.map((file) => {
      const image = new Image({
        fileName: file.originalname,
        filePath: `images/${encodeURIComponent(file.filename)}`,
      });
      return image.save();
    });


    const images = await Promise.all(imagePromises);

    // Add images to the project
    project.images.push(...images.map((image) => image._id));
    await project.save();

    res.status(201).json({ message: "Images uploaded successfully", images });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Error uploading images", error });
  }
});



// Update an existing project
app.put('/projects/:id', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, labels } = req.body;

    // Find the project by ID
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update project fields
    project.name = name || project.name;
    project.description = description || project.description;

    // Handle new files (if any were uploaded)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        fileName: file.originalname,
        filePath: `images/${encodeURIComponent(file.filename)}`, // Normalize path with forward slashes
      }));

      // Save the new images to the database
      const imagePromises = newImages.map(image => new Image(image).save());
      const savedImages = await Promise.all(imagePromises);

      // Append the new image IDs to the project's images array
      project.images = [...project.images, ...savedImages.map(img => img._id)];
    }

    // Handle labels if they are provided
    if (labels && labels.length > 0) {
      const labelIds = await Promise.all(
        labels.map(async (labelId) => {
          const label = await Label.findById(labelId);
          if (!label) {
            throw new Error(`Label with ID ${labelId} not found`);
          }
          return label._id;
        })
      );

      // Update labels for the project
      project.labels = labelIds;
    }

    // Save the updated project
    const updatedProject = await project.save();

    res.json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error });
  }
});

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

app.get('/labels', verifyToken, async (req, res) => {
  try {
    const labels = await Label.find();
    
    res.json(labels);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});

// POST endpoint to create a label
app.post('/labels', verifyToken, async (req, res) => {
  const { name, color } = req.body;
  
  try {
    const newLabel = new Label({
      name,
      color,
    });

    const savedLabel = await newLabel.save();
    res.status(201).json(savedLabel);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ message: 'Error creating label', error });
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
    ).populate('annotations.label'); // Populate label details

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
      return res.status(400).json({ message: "Invalid email or password format" });
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

    res.status(200).json({ message: "Login successful", token, email: user.email });
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
