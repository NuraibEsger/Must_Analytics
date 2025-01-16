const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/Must_Analytics")
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

/** User Schema **/
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

/** Image Schema for storing uploaded images **/
const ImageSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    // One-to-many relationship: an image may have multiple annotations
    annotations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Annotation" }
    ],
  },
  { timestamps: true }
);

/** Annotation Schema – An annotation is now a separate collection **/
const AnnotationSchema = new mongoose.Schema(
  {
    // Reference back to the related image
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    type: { 
      type: String, 
      enum: ["rectangle", "polygon"], 
      required: true 
    },
    coordinates: {
      type: [[Number]],
      default: undefined,
    },

    bbox: {
      type: [Number],
      default: undefined,
    },
    label: { type: mongoose.Schema.Types.ObjectId, ref: "Label" },
  },
  { timestamps: true }
);

/** Label Schema **/
const LabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String, // e.g. a hex color string
    required: true,
  },
  // Optional: store references to projects that use this label
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
});

/** Project Schema with one-to-many relationships to Image and Label **/
const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Image" }],
  labels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Label" }],
  members: [
    {
      email: { type: String },
      role: { type: String, enum: ['editor', 'visitor'] },
    },
  ],
  created_at: { type: Date, required: true, default: Date.now },
});

/** Models **/
const User = mongoose.model("User", UserSchema);
const Image = mongoose.model("Image", ImageSchema);
const Annotation = mongoose.model("Annotation", AnnotationSchema);
const Label = mongoose.model("Label", LabelSchema);
const Project = mongoose.model("Project", ProjectSchema);

/**
 * getProjectById
 * This helper function finds a project by its ID and populates its images and labels.
 */
const getProjectById = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate("images")
      .populate("labels");
    return project;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    throw error; // Re-throw the error to be handled by route middleware or caller
  }
};

ProjectSchema.post("save", async function (doc, next) {
  try {
    if (doc.labels && doc.labels.length > 0) {
      await Promise.all(
        doc.labels.map(async (labelId) => {
          await mongoose.model("Label").findByIdAndUpdate(
            labelId,
            { $addToSet: { projects: doc._id } },
            { new: true }
          );
        })
      );
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = { User, Project, Image, Label, Annotation, getProjectById };
