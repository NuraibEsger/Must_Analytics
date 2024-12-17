// src/hooks/useLabelForm.js

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { labelSchema } from "../validations/labelSchema";
import { postLabel, postLabelByProject } from "../services/labelService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export const useLabelForm = (toggleLabelModal, projectId = null) => {
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.account.token);
  
  const mutation = useMutation({
    mutationFn: (formData) => {
      if (projectId) {
        return postLabelByProject(projectId, formData, token);
      }
      return postLabel(formData, token);
    },
    onSuccess: () => {
      toggleLabelModal();
      if (projectId) {
        queryClient.invalidateQueries(["labels", projectId]);
        queryClient.invalidateQueries(["imageDetails", projectId]);
      } else {
        queryClient.invalidateQueries(["labels"]);
      }
      toast.success("Label created successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    },
    onError: (error) => {
      console.error("Error uploading label: ", error);
      toast.error("Failed to create label.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      color: "#000000",
    },
    validationSchema: labelSchema,
    onSubmit: (values, { setSubmitting }) => {
      mutation.mutate(values);
      setSubmitting(false);
    },
  });

  return { formik, isSubmitting: mutation.isLoading };
};
