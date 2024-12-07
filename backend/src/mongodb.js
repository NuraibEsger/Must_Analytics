const mongoose = require('mongoose');
const { ref } = require('yup');

mongoose.connect('mongodb://localhost:27017/Must_Analytics')
.then(() => {
  console.log("mongodb connected");
}).catch((err) => {
  console.log(err);
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});


// Image Schema for storing uploaded images
// Image Schema for storing uploaded images
const ImageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  annotations: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      coordinates: [
        {
          type: [[Number]], // This is an array of arrays of numbers for lat/lng
        },
      ],
      bounds: {
        southWest: { type: [Number] }, // Array [lat, lng]
        northEast: { type: [Number] }, // Array [lat, lng]
      },
      label: { type: mongoose.Schema.Types.ObjectId, ref: 'Label' }, // Add reference to Label collection
    },
  ],
});


/// Label Schema
const LabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String, // Hex code or any string representation of color
    required: true,
  },

  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
});

// Project Schema with one-to-many relationship to Image
const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],

  created_at : { type: Date, required: true, default: Date.now }
});

// Models
const Project = mongoose.model('Project', ProjectSchema);
const Image = mongoose.model('Image', ImageSchema);
const Label = mongoose.model('Label', LabelSchema);
const User = mongoose.model('User', UserSchema);


const getProjectById = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate("images").populate("labels");
    return project;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    throw error; // Re-throw the error to handle it in the route
  }
};

module.exports = { User, Project, Image, Label, getProjectById };