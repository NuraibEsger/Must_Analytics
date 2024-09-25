import * as Yup from "yup";

export const projectSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name is too short!")
    .max(50, "Name is too long!")
    .required("Project Name is required"),
  description: Yup.string()
    .min(10, "Description is too short!")
    .max(500, "Description is too long!"),

  labelId: Yup.array()
    .of(Yup.string().required("Label ID is required"))
    .min(1, "At least one label is required"),

  files: Yup.mixed().required("File is required"),
});
