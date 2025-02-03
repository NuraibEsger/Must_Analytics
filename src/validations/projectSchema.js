import * as Yup from "yup";

export const projectSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name is too short!")
    .max(50, "Name is too long!")
    .required("Project Name is required"),

  labels: Yup.array()
    .of(Yup.string().required("Label ID is required"))
    .min(1, "At least one label is required"),

  files: Yup.mixed().required("File is required"),
});
