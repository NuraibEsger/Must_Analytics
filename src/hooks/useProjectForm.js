import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postProject } from "../services/projectService";
import { useFormik } from "formik";
import { projectSchema } from "../validations/projectSchema";

export const useProjectForm = (toggleModal) => {
  const [files, setFiles] = useState([]);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (formData) => postProject(formData),
    onSuccess: () => {
      toggleModal();
      queryClient.invalidateQueries(["projects"]);
    },
    onError: (error) => {
      console.error("Error uploading project: ", error);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      labels: [],
      files: [],
    },
    validationSchema: projectSchema,
    onSubmit: (values, { setSubmitting }) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);

      console.log(formik.values.labelId);
      
      values.labels.forEach((labelId) => {
        formData.append("labels", labelId);
      });

      console.log(formData.get('labelId'));
      

      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      mutation.mutate(formData);
      setSubmitting(false);
    },
  });

  const handleFileChange = (e) => {
    
    const filesArray = e.currentTarget.files;
    formik.setFieldValue("files", filesArray);
    setFiles(filesArray);
  };

  return { formik, handleFileChange, isSubmitting: mutation.isPending };
};
