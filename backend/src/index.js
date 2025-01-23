const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const cors = require("cors");
const multer = require("multer");
const { User, Project, Image, Label, Annotation } = require("./mongodb"); // Import the new models
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const nodemailer = require("nodemailer");
require("dotenv").config();
const frontUrl = process.env.FRONT_END_URL;

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
    req.userEmail = decoded.email;
    next();
  });
};

// Get all projects along with associated images
app.get("/projects", verifyToken, async (req, res) => {
  try {
    const userEmail = req.userEmail;

    const projects = await Project.find({
      "members.email": userEmail, // user is any role, if you want 'editor' only you can add "members.role": "editor"
    }).populate("images");

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

// Export project in COCO JSON format
app.get("/projects/:id/export", verifyToken, async (req, res) => {
  const projectId = req.params.id;
  try {
    // Fetch project data with populated images, labels, and ideally annotations.
    // Ensure that your getProjectById function populates images and annotations.
    const projectData = await collection.getProjectById(projectId);

    if (!projectData) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Prepare basic COCO structure.
    const cocoData = {
      info: {
        description: projectData.name,
        version: "1.0",
        contributor: "",
        date_created: projectData.created_at || new Date(),
      },
      licenses: [
        // Fill in license details if needed.
      ],
      images: [],
      annotations: [],
      categories: [],
    };

    // Map labels to categories.
    // Create a mapping from each label's ObjectId (as a string) to a numeric category id.
    const categoryMapping = {};
    projectData.labels.forEach((label, index) => {
      const categoryId = index + 1; // Using an incrementing number.
      categoryMapping[label._id.toString()] = categoryId;
      cocoData.categories.push({
        id: categoryId,
        name: label.name,
        // Optionally include extra fields (e.g. color, supercategory).
        color: label.color,
        supercategory: "none",
      });
    });

    let globalAnnotationId = 1;
    let globalImageId = 1;

    // Process each image in the project.
    projectData.images.forEach((image) => {
      // Use stored dimensions if available; otherwise, fall back to defaults.
      const imgWidth = image.width || 640;
      const imgHeight = image.height || 480;

      cocoData.images.push({
        id: globalImageId,
        file_name: image.fileName,
        width: imgWidth,
        height: imgHeight,
        license: 1, // You can adjust if you have license info.
        date_captured: image.createdAt ? image.createdAt.toISOString() : "",
      });

      // Process each annotation in this image.
      if (image.annotations && image.annotations.length > 0) {
        image.annotations.forEach((ann) => {
          let bbox = [];
          let segmentation = [];
          let area = 0;

          if (ann.type === "rectangle") {
            // First, try to use the stored bbox (if available and valid).
            const x =
              ann.bbox && ann.bbox[0] !== undefined
                ? ann.bbox[0]
                : ann.x;
            const y =
              ann.bbox && ann.bbox[1] !== undefined
                ? ann.bbox[1]
                : ann.y;
            const width =
              ann.bbox && ann.bbox[2] !== undefined
                ? ann.bbox[2]
                : ann.width;
            const height =
              ann.bbox && ann.bbox[3] !== undefined
                ? ann.bbox[3]
                : ann.height;

            if (x != null && y != null && width != null && height != null) {
              bbox = [x, y, width, height];
              area = width * height;
              // Create a rectangular segmentation (four corners).
              segmentation = [[
                x, y,
                x + width, y,
                x + width, y + height,
                x, y + height
              ]];
            }
          } else if (ann.type === "polygon") {
            // Process polygon: ensure segmentation is an array of arrays.
            if (ann.coordinates) {
              segmentation = Array.isArray(ann.coordinates[0])
                ? ann.coordinates
                : [ann.coordinates];
              // Compute bbox from segmentation:
              const flatPoints = segmentation[0];
              const xs = [];
              const ys = [];
              for (let i = 0; i < flatPoints.length; i += 2) {
                xs.push(flatPoints[i]);
                ys.push(flatPoints[i + 1]);
              }
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              bbox = [minX, minY, maxX - minX, maxY - minY];
              // Optionally, compute polygon area here.
              area = 0;
            }
          }

          // Determine the category id based on the label associated with the annotation.
          const categoryId =
            ann.label && categoryMapping[ann.label.toString()]
              ? categoryMapping[ann.label.toString()]
              : 0;

          cocoData.annotations.push({
            id: globalAnnotationId,
            image_id: globalImageId,
            category_id: categoryId,
            segmentation,
            bbox,
            area,
            iscrowd: 0,
          });
          globalAnnotationId++;
        });
      }

      globalImageId++;
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project_${projectId}_COCO.json`
    );
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(cocoData, null, 2));
  } catch (error) {
    console.error("Export Error: ", error);
    res.status(500).json({
      message: "Error exporting project",
      error: error.message,
    });
  }
});



// GET /project/:id
app.get("/project/:id", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const requestingUserEmail = req.userEmail;

    // Validate Project ID format (optional but recommended)
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    // Fetch project details excluding images
    const project = await Project.findById(projectId)
      .select("name description labels members") // Select necessary fields
      .populate("labels"); // Populate labels if necessary

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isEditor = project.members.some(
      (m) => m.email === requestingUserEmail && m.role === "editor"
    );
    const isVisitor = project.members.some(
      (m) => m.email === requestingUserEmail && m.role === "visitor"
    );

    if (!isEditor && !isVisitor) {
      return res.status(403).json({
        message: "You do not have permission to view this project.",
      });
    }

    res.json({ data: project });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res
      .status(500)
      .json({ message: "Error fetching project", error: error.message });
  }
});

app.get("/project/:id/statistics", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Validate Project ID format (optional but recommended)
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    // Fetch project details
    const project = await Project.findById(projectId)
      .select("labels images")
      .exec();
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const totalLabels = project.labels.length;
    const totalImages = project.images.length;

    // Count images with at least one annotation
    const labeledImagesCount = await Image.countDocuments({
      _id: { $in: project.images },
      annotations: { $exists: true, $not: { $size: 0 } },
    });

    const unlabeledImagesCount = totalImages - labeledImagesCount;

    res.json({
      totalLabels,
      totalImages,
      labeledImagesCount,
      unlabeledImagesCount,
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res
      .status(500)
      .json({ message: "Error fetching statistics", error: error.message });
  }
});

// Get a project by ID along with associated images
app.get("/project/:id/images", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 50;

    // Validate project existence
    const project = await Project.findById(projectId).select("images");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Fetch the paginated images sorted by createdAt descending
    const images = await Image.find({ _id: { $in: project.images } })
      .sort({ createdAt: -1 }) // Sort newest first
      .skip(skip)
      .limit(limit)
      .exec();

    // Calculate if there is a next page
    const totalImages = project.images.length;
    const hasNextPage = skip + limit < totalImages;
    const nextSkip = hasNextPage ? skip + limit : null;

    res.json({
      images,
      hasNextPage,
      nextSkip,
    });
  } catch (error) {
    console.error("Error fetching paginated images:", error);
    res.status(500).json({ message: "Error fetching images", error });
  }
});

// Get image by ID
app.get("/image/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const image = await Image.findById(id)
      .populate({
        path: "annotations",
        populate: { path: "label" },
      })
      .lean();

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Find the project that contains this image
    const project = await Project.findOne({ images: image._id })
      .populate("labels members")
      .lean();

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found for this image" });
    }

    const members = project?.members ?? [];

    // Ensure labels are returned as an array
    const labels = Array.isArray(project.labels)
      ? project.labels
      : [project.labels];

    // Return image and project labels
    res.json({ projectId: project._id, members, image, labels });
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
      let { name, description, labels, members } = req.body;

      // 1. Parse members if it's a JSON string
      let parsedMembers = [];
      if (members) {
        if (typeof members === "string") {
          // e.g. "[{\"email\":\"nuraibesger@gmail.com\",\"role\":\"editor\"}]"
          parsedMembers = JSON.parse(members);
        } else if (Array.isArray(members)) {
          parsedMembers = members;
        }
      }

      // Validate required fields
      if (!name) {
        return res
          .status(400)
          .json({ message: "Name and description are required" });
      }

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one image file is required" });
      }

      // 2. Create project with parsedMembers
      const project = new Project({
        name,
        description,
        members: parsedMembers, // Now an array of {email, role}
      });

      // 3. Save each uploaded image
      const imagePromises = req.files.map((file) => {
        const image = new Image({
          fileName: file.originalname,
          filePath: `images/${encodeURIComponent(file.filename)}`,
        });
        return image.save();
      });
      const images = await Promise.all(imagePromises);

      // 4. Add images to the project
      project.images = images.map((image) => image._id);

      // 5. Handle labels
      const labelArray = Array.isArray(labels) ? labels : [labels];
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

      // 6. Save project
      await project.save();

      // 7. Update each label to include this project
      if (project.labels && project.labels.length > 0) {
        await Promise.all(
          project.labels.map(async (labelId) => {
            await Label.findByIdAndUpdate(
              labelId,
              { $addToSet: { projects: project._id } }, // $addToSet prevents duplicates
              { new: true }
            );
          })
        );
      }

      res.json({ message: "Project and images saved successfully", project });
    } catch (error) {
      console.error("Upload Error: ", error.message);
      res.status(500).json({
        message: "Error uploading project",
        error: error.message,
      });
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
      const imageIds = images.map((img) => img._id);

      // Update Project: add new image IDs to the beginning of the images array
      await Project.findByIdAndUpdate(id, {
        $push: { images: { $each: imageIds, $position: 0 } }, // Inserts at the beginning
      });

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
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Optionally, delete associated images
    await Project.findByIdAndDelete(id);
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

      // Capture the current (old) labels before updating
      const oldLabelIds = project.labels.map((labelId) => labelId.toString());

      project.name = name || project.name;
      project.description = description;

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

      // Ensure labels is treated as an array
      const labelArray = Array.isArray(labels) ? labels : [labels];
      let newLabelIds = [];
      if (labelArray?.length > 0) {
        newLabelIds = await Promise.all(
          labelArray.map(async (labelId) => {
            const label = await Label.findById(labelId);
            if (!label)
              throw new Error(`Label with ID ${labelId} not found`);
            return label._id.toString();
          })
        );
        project.labels = newLabelIds;
      } else {
        project.labels = [];
      }

      const updatedProject = await project.save();

      // Determine which labels were removed
      const removedLabels = oldLabelIds.filter(
        (oldId) => !newLabelIds.includes(oldId)
      );

      // For each removed label, remove the project id from the label document
      await Promise.all(
        removedLabels.map(async (labelId) => {
          await Label.findByIdAndUpdate(
            labelId,
            { $pull: { projects: updatedProject._id } },
            { new: true }
          );
        })
      );

      // For each newly added label, ensure the label document contains the project id
      await Promise.all(
        newLabelIds.map(async (labelId) => {
          await Label.findByIdAndUpdate(
            labelId,
            { $addToSet: { projects: updatedProject._id } },
            { new: true }
          );
        })
      );

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

app.get("/labels/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const labels = await Label.find({ projects: { $in: [projectId] } });

    res.json(labels);
  } catch (error) {
    console.error("Error fetching labels for project:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

app.put("/labels/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    const updatedLabel = await Label.findByIdAndUpdate(
      id,
      { name, color },
      { new: true }
    );

    if (!updatedLabel) {
      return res.status(404).json({ message: "Label not found" });
    }

    res.json(updatedLabel);
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ message: "Error creating label", error });
  }
});
// Express Router

app.post("/projects/:projectId/labels", verifyToken, async (req, res) => {
  const { projectId } = req.params;
  const { name, color } = req.body;
  // Basic validation
  if (!name || !color) {
    return res.status(400).json({ message: "Name and color are required." });
  }

  try {
    // Check if the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Create the new label
    const newLabel = new Label({
      name,
      color,
      projects: [projectId], // Associate with the project
    });

    await newLabel.save();

    // Add the label to the project's labels array
    project.labels.push(newLabel._id);
    await project.save();

    res.status(201).json(newLabel);
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/image/:id/annotations", async (req, res) => {
  const { id: imageId } = req.params;
  let { annotations } = req.body;

  annotations = annotations.filter((ann) => ann != null);

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const annotationDocs = await Promise.all(
      annotations.map(async (ann) => {
        let dataToSave = { ...ann, image: imageId };

        if (ann.type === "rectangle") {
          dataToSave.bbox = [ann.x, ann.y, ann.width, ann.height];
        } else if (ann.type === "polygon") {
          if (typeof ann.coordinates === "string") {
            try {
              ann.coordinates = JSON.parse(ann.coordinates);
            } catch (error) {
              throw new Error("Invalid coordinates format");
            }
          }
          dataToSave.coordinates = ann.coordinates;
        }

        if (!ann._id) {
          const annotation = new Annotation(dataToSave);
          await annotation.save();
          return annotation._id;
        } else {
          await Annotation.findByIdAndUpdate(ann._id, dataToSave);
          return ann._id;
        }
      })
    );

    image.annotations = image.annotations.concat(annotationDocs);
    const updatedImage = await image.save();

    await updatedImage.populate({
      path: "annotations",
      populate: { path: "label" },
    });

    res.json({
      message: "Annotations saved successfully",
      image: updatedImage,
    });
  } catch (error) {
    console.error("Error saving annotations:", error);
    res.status(500).json({ message: "Error saving annotations", error });
  }
});

app.patch("/annotations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Use $set to update only the provided fields.
    const updateData = req.body ;

    // The { new: true } option returns the updated document.
    const updatedAnnotation = await Annotation.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedAnnotation) {
      return res.status(404).json({ message: "Annotation not found" });
    }
    
    res.json({ annotation: updatedAnnotation });
  } catch (error) {
    console.error("Error updating annotation:", error);
    res.status(500).json({ message: "Server error updating annotation" });
  }
});

app.patch("/annotations/:id/label", async (req, res) => {
  const { id } = req.params;
  const { labelId } = req.body;

  try {
    const annotation = await Annotation.findById(id);

    if (!annotation) {
      return res.status(404).json({ message: "Annotation not found" });
    }

    if (annotation.label && annotation.label.toString() === labelId) {
      return res.json({ annotation });
    }

    const updatedAnnotation = await Annotation.findByIdAndUpdate(
      id,
      { label: labelId },
      { new: true }
    );

    res.json({ annotation: updatedAnnotation });
  } catch {
    console.error("Error updating annotation label:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/annotations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const annotation = await Annotation.findByIdAndDelete(id);
    if (!annotation) {
      return res.status(404).json({ message: "Annotation not found" });
    }
    // Remove annotation reference from the related image.
    await Image.findByIdAndUpdate(annotation.image, {
      $pull: { annotations: annotation._id },
    });
    res.json({ message: "Annotation deleted successfully" });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

app.post("/project/:projectId/invite", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body; // from the invite modal

    // 1. Check if userEmail is project owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const existingMember = project.members.find((m) => m.email === email);
    if (existingMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 2. Generate a token to encode the invite info
    const inviteToken = jwt.sign(
      { projectId, email, role },
      JWT_SECRET,
      { expiresIn: "7d" } // token expires in 7 days
    );

    const inviteLink = `${frontUrl}/accept-invite?token=${inviteToken}`;

    // 3. Send email using nodemailer (SMTP)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "nurayib.esger@gmail.com",
        pass: "blhwtyuhkaidqpck",
      },
    });

    await transporter.sendMail({
      from: `"Project Invites" nurayib.esger@gmail.com`,
      to: email,
      subject: `Invitation to join ${project.name}`,
      text: `Hello! You have been invited to join project "${project.name}" as a ${role}.
             Click this link to accept: ${inviteLink}`,
    });

    return res.status(200).json({ message: "Invite sent successfully." });
  } catch (err) {
    console.error("Error sending invite:", err);
    return res.status(500).json({ message: "Error sending invite." });
  }
});

app.post("/project/accept-invite", async (req, res) => {
  try {
    const { token } = req.body;
    // decode token
    const { projectId, email, role } = jwt.verify(token, JWT_SECRET);

    // find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // add member if not existing
    const existingMember = project.members.find((m) => m.email === email);
    if (existingMember) {
      // update role if needed or do nothing
      existingMember.role = role;
    } else {
      project.members.push({ email, role });
    }
    await project.save();

    return res
      .status(200)
      .json({ message: "Invite accepted. Welcome to the project!" });
  } catch (err) {
    console.error("Error accepting invite:", err);
    return res.status(400).json({ message: "Invalid or expired invite link." });
  }
});

//#endregion

app.listen(3001, () => {
  console.log("Server is Running");
});
