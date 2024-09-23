import * as Yup from "yup";

export const projectSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name is too short!")
    .max(50, "Name is too long!")
    .required("Project Name is required"),
  description: Yup.string()
    .min(10, "Description is too short!")
    .max(500, "Description is too long!")
    .required("Project Description is required"),

  files: Yup.mixed().required("File is required"),
});
