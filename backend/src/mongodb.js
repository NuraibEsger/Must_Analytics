const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Must_Analytics')
.then(() => {
  console.log("mongodb connected");
}).catch((err) => {
  console.log(err);
});

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
});

// Models
const Project = mongoose.model('Project', ProjectSchema);
const Image = mongoose.model('Image', ImageSchema);

module.exports = {Project, Image};