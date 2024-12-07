import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postProject, updateProject } from "../services/projectService"; // Assuming updateProject is the API call for editing
import { useFormik } from "formik";
import { projectSchema } from "../validations/projectSchema";
import { useSelector } from "react-redux";

export const useProjectForm = (toggleModal, initialData) => {
  const [files, setFiles] = useState([]);
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.account.token);


  const mutation = useMutation({
    mutationFn: (formData) => {
      if (initialData) {
        return updateProject(initialData.id, formData, token); // Call updateProject when editing
      } else {
        return postProject(formData, token); // Call postProject when creating
      }
    },
    onSuccess: () => {
      toggleModal();
      queryClient.invalidateQueries(["projects"]); // Invalidate the projects query to refresh the list
    },
    onError: (error) => {
      console.error("Error uploading project: ", error);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      labels: initialData?.labels.map(label => label._id) || [],
      files: [],
    },
    validationSchema: projectSchema,
    enableReinitialize: true, // This ensures the form resets when initialData changes
    onSubmit: (values, { setSubmitting }) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      
      values.labels.forEach((labelId) => {
        formData.append("labels", labelId);
      });

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

  // Set initial files when editing
  useEffect(() => {
    if (initialData && initialData.files) {
      setFiles(initialData.files);
    }
  }, [initialData]);

  return { formik, handleFileChange, isSubmitting: mutation.isPending };
};
