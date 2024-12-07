import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { labelSchema } from "../validations/labelSchema";
import { postLabel } from "../services/labelService";
import { useSelector } from "react-redux";

export const useLabelForm = (toggleLabelModal) => {
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.account.token);
    const mutation = useMutation({
      mutationFn: (formData) => postLabel(formData, token),
      onSuccess: () => {
        toggleLabelModal();
        queryClient.invalidateQueries(["labels"]);
      },
      onError: (error) => {
        console.error("Error uploading project: ", error);
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

    return { formik, isSubmitting: mutation.isPending };
}