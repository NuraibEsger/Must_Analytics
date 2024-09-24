const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const cors = require("cors");
const multer = require("multer");
const { Project, Image, Label } = require("./mongodb"); // Import the new models
const fs = require('fs');

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, '../templates'));
app.use(express.urlencoded({ extended: false }));

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true})
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({storage});

// Get all projects along with associated images
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().populate('images'); // Populates the images field with image details
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});

// Get a project by ID along with associated images
app.get('/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId).populate('images'); // Populates the images field with image details

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Error fetching project', error });
  }
});

// Create a new project and associate uploaded images
app.post('/projects', upload.array('files', 10), async (req, res) => {  
  try {
    const { name, description } = req.body;

    // Create project
    const project = new Project({ name, description });
    await project.save();

    // Save each uploaded image
    const imagePromises = req.files.map((file) => {
      const image = new Image({
        fileName: file.originalname,
        filePath: file.path,
      });
      return image.save();
    });

    console.log('Saving images...');
    const images = await Promise.all(imagePromises);
    console.log('Images saved:', images);

    // Add images to the project
    project.images = images.map((image) => image._id);
    await project.save();

    res.json({ message: 'Project and images saved successfully' });
  } catch (error) {
    console.error('Upload Error: ', error);
    res.status(500).json({ message: 'Error uploading images', error });
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

app.get("/signUp", async (req, res) => {
  await res
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

app.get('/labels', async (req, res) => {
  try {
    const labels = await Label.find();
    
    res.json(labels);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});

// POST endpoint to create a label
app.post('/labels', async (req, res) => {
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

//#endregion

//#region Auth
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({
      email: req.body.email,
    });

    if (check.password === req.body.password) {
      res.send("success");
    } else {
      res.send("wrong password");
    }
  } catch {
    res.send("no user found");
  }
});

app.post("/signUp", async (req, res) => {
  const data = {
    email: req.body.email,
  };

  await collection.insertMany([data]);

  res.send("success");
});
//#endregion

app.listen(3001, () => {
  console.log("Server is Running");
});
