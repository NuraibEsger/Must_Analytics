import * as Yup from "yup";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const labelSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name is too short!")
    .max(50, "Name is too long!")
    .required("Project Name is required"),

  color: Yup.string()
  .matches(hexColorRegex, 'Invalid color format')
  .required('Color is required'),
});
