import { useState } from "react";
import { useProjectForm } from "../hooks/useProjectForm";
import AddLabelModal from "./AddLabelModal";
import { useQuery } from "@tanstack/react-query";
import { getLabels } from "../services/labelService";
import Select from "react-select";
import { useSelector } from "react-redux";

export default function Modal({ isOpen, toggleModal, initialData }) {
  const { formik, handleFileChange, isSubmitting } = useProjectForm(toggleModal, initialData);
  const [isModalOpen, setModalOpen] = useState(false);
  const token = useSelector((state) => state.account.token);

  const toggleLabelModal = () => {
    setModalOpen(!isModalOpen);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      return await getLabels(token);
    },
    cacheTime: 5000,
    enabled: isOpen, // Only fetch if modal is open
  });

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Show a loading spinner if data is loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  // Show an error message if there is an error fetching labels
  if (isError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <p className="text-red-600 font-semibold">Error fetching labels:</p>
          <p className="text-sm text-gray-700 mt-2">{error?.message || "Please try again."}</p>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
              onClick={toggleModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Proceed if data is successfully fetched
  const labelOptions = data.data.map((label) => ({
    value: label._id,
    label: label.name,
    color: label.color,
  }));

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color,
      color: "#fff",
      padding: 10,
    }),
    multiValue: (styles, { data }) => ({
      ...styles,
      backgroundColor: data.color,
      color: "#fff",
    }),
    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: "#fff",
    }),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? "Edit Project" : "Add New Project"}
        </h2>

        <form method="post" onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Project Name"
              value={formik.values.name}
              onChange={formik.handleChange}
            />
            {formik.errors.name && formik.touched.name && (
              <span style={{ color: "red" }}>{formik.errors.name}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Project Description"
              value={formik.values.description}
              onChange={formik.handleChange}
            ></textarea>
            {formik.errors.description && formik.touched.description && (
              <span style={{ color: "red" }}>{formik.errors.description}</span>
            )}
          </div>

          <label className="block text-gray-700 font-bold mb-2">Labels</label>
          <div className="mb-4 flex justify-between">
            <Select
              isMulti
              name="labels"
              options={labelOptions}
              className="basic-multi-select w-full"
              classNamePrefix="select"
              styles={customStyles}
              value={labelOptions.filter((option) =>
                formik.values.labels?.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                formik.setFieldValue(
                  "labels",
                  selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : []
                )
              }
              placeholder="Add labels"
            />
            {formik.errors.labels && formik.touched.labels && (
              <span style={{ color: "red" }}>{formik.errors.labels}</span>
            )}
            <button
              type="button"
              className="v-btn v-btn--icon v-btn--round ml-4 p-3 rounded-full text-white"
              style={{
                backgroundColor: "rgb(126 34 206 / var(--tw-bg-opacity))",
              }}
              onClick={toggleLabelModal}
            >
              +
            </button>

            <AddLabelModal
              isOpen={isModalOpen}
              onClose={() => setModalOpen(false)}
              toggleLabelModal={toggleLabelModal}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Upload Files
            </label>
            <input
              name="files"
              type="file"
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={handleFileChange}
            />
            {formik.errors.files && formik.touched.files && (
              <span style={{ color: "red" }}>{formik.errors.files}</span>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
              onClick={toggleModal}
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-purple-700 text-white px-4 py-2 rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
