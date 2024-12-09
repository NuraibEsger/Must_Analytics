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
      const projectId = initialData?.id || initialData?._id; // Use either id or _id
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
      name: initialData?.name || "",
      description: initialData?.description || "",
      labels: Array.isArray(initialData?.labels) 
        ? initialData?.labels.map(label => label._id) 
        : [], // Ensure it's an array
      files: [],
    },
    validationSchema: projectSchema,
    enableReinitialize: true, // This ensures the form resets when initialData changes
    onSubmit: (values, { setSubmitting }) => {
      const formData = new FormData();
    
      // Append project name and description
      formData.append("name", values.name);
      formData.append("description", values.description);
      
      // Ensure labels is an array, even if it's a single value
      const labels = Array.isArray(values.labels) ? values.labels : [values.labels];
      labels.forEach((labelId) => {
        formData.append("labels", labelId);
      });
    
      // Append files
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
    
      // Trigger mutation
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
