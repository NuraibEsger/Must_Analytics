import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { postProject, updateProject } from "../services/projectService"; 
import { useFormik } from "formik";
import { projectSchema } from "../validations/projectSchema";
import { useSelector } from "react-redux";

export const useProjectForm = (toggleModal, initialData) => {
  const [files, setFiles] = useState([]);
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.account.token);
  const email = useSelector((state) => state.account.email);
  
  const projectId = initialData?.data?.id || initialData?.data?._id;

  const mutation = useMutation({
    mutationFn: (formData) => {
      // If editing
      if (projectId) {
        return updateProject(projectId, formData, token);
      } 
      // Else creating a new project
      else {
        return postProject(formData, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["Projects"]);
      toggleModal();
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
        ? initialData?.data?.labels.map((label) => label._id)
        : [],
      // Make `members` an array so we can easily handle more than one member
      members: [
        {
          email: email,  // The logged-in user's email
          role: projectId ? "editor" : "owner" // Default role for creator
        }
      ],
      files: [],
    },
    validationSchema: projectSchema,
    enableReinitialize: true,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const formData = new FormData();
    
      // Append project name, description
      formData.append("name", values.name);
      formData.append("description", values.description);

      // Convert members array to JSON string
      formData.append("members", JSON.stringify(values.members));

      // Append labels
      const labels = Array.isArray(values.labels) ? values.labels : [values.labels];
      labels.forEach((labelId) => {
        formData.append("labels", labelId);
      });

      // Append new files
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      // If editing, handle existing files
      if (initialData?.files) {
        initialData.files.forEach((file) => {
          formData.append("existingFiles", file._id);
        });
      }

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

  // If editing, load existing files into state
  useEffect(() => {
    if (initialData && initialData.files) {
      setFiles(initialData.data.files);
    }
  }, [initialData]);

  return { formik, handleFileChange, isSubmitting: mutation.isPending };
};
