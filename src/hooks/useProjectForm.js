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

  console.log(initialData)

  const mutation = useMutation({
    mutationFn: (formData) => {
      const projectId = initialData?.data?.id || initialData?.data?._id; // Use either id or _id
      if (projectId) {
        return updateProject(projectId, formData, token);
      } else {
        return postProject(formData, token);
      }
    },
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
      name: initialData?.data?.name || "",
      description: initialData?.data?.description || "",
      labels: Array.isArray(initialData?.data?.labels) 
        ? initialData?.data?.labels.map(label => label._id) 
        : [], // Ensure it's an array
      files: [],
    },
    validationSchema: projectSchema,
    enableReinitialize: true, // This ensures the form resets when initialData changes
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const formData = new FormData();
    
      // Append project name and description
      formData.append("name", values.name);
      formData.append("description", values.description);
    
      // Append labels
      const labels = Array.isArray(values.labels) ? values.labels : [values.labels];
      labels.forEach((labelId) => {
        formData.append("labels", labelId);
      });
    
      // Append new files
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
    
      // If editing, you might want to handle existing files differently
      // For example, sending an array of existing file IDs to retain them
      if (initialData?.files) {
        initialData.files.forEach((file) => {
          formData.append("existingFiles", file._id);
        });
      }
    
      // Trigger mutation
      mutation.mutate(formData, {
        onSuccess: () => {
          setSubmitting(false);
          resetForm();
        },
        onError: () => {
          setSubmitting(false);
        },
      });
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
      setFiles(initialData.data.files);
    }
  }, [initialData]);

  return { formik, handleFileChange, isSubmitting: mutation.isPending };
};
