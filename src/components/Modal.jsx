import {   useState } from "react";
import { useProjectForm } from "../hooks/useProjectForm";
import AddLabelModal from "./AddLabelModal";
import { useQuery } from "react-query";
import { getLabels } from "../services/labelService";
import Select from "react-select";
import { useSelector } from "react-redux";
import { FiEdit, FiPlus, FiUploadCloud } from "react-icons/fi";
import EditLabelsModal from "./EditLabelsModal";

export default function Modal({ isOpen, toggleModal, initialData }) {
  const { formik, handleFileChange, isSubmitting } = useProjectForm(
    toggleModal,
    initialData
  );
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditLabelsModalOpen, setEditLabelsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const token = useSelector((state) => state.account.token);

  const toggleLabelModal = () => {
    setModalOpen(!isModalOpen);
  };

  const toggleEditLabelsModal = () => {
    setEditLabelsModalOpen(!isEditLabelsModalOpen);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      return await getLabels(token);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    enabled: isOpen, // Only fetch if modal is open
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-lg"
          role="document"
        >
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            {initialData ? "Edit Project" : "Add New Project"}
          </h2>
        </div>
      </div>
    );
  }

  const labelOptions = data.data.map((label) => ({
    value: label._id,
    label: label.name,
    color: label.color,
  }));

  const formatOptionLabel = (option) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span
        style={{
          backgroundColor: option.color,
          borderRadius: "50%",
          width: "10px",
          height: "10px",
          display: "inline-block",
          marginRight: "8px",
        }}
      ></span>
      <span>{option.label}</span>
    </div>
  );

  const handleCustomFileChange = (e) => {
    const files = e.target.files;
    setSelectedFiles(Array.from(files));
    formik.setFieldTouched("files", true);
    handleFileChange(e);
  };

  const truncateFileName = (fileName, maxLength = 20) => {
    return fileName.length > maxLength
      ? `${fileName.substring(0, maxLength)}...`
      : fileName;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleModal();
      }}
      role="dialog"
      aria-modal="true"
    >
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
              <span className="text-red-500">{formik.errors.name}</span>
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
              <span className="text-red-500">{formik.errors.description}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Upload Files
            </label>
            <div className="relative">
              <input
                id="file-input"
                name="files"
                type="file"
                multiple
                onChange={handleCustomFileChange}
                onBlur={formik.handleBlur}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="border h-10 border-gray-300 rounded-md px-4 py-2 flex items-center justify-center cursor-pointer">
                <div className="flex items-center">
                  <FiUploadCloud className="text-purple-700 mr-3 text-4xl" />
                  <span className="text-gray-600">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} files selected`
                      : "Choose files..."}
                  </span>
                </div>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-600 truncate"
                    title={file.name}
                  >
                    {truncateFileName(file.name)}
                  </div>
                ))}
              </div>
            )}
            {formik.errors.files && formik.touched.files && (
              <span className="text-red-500">{formik.errors.files}</span>
            )}
          </div>

          <label className="block text-gray-700 font-bold mb-2">Labels</label>
          <div className="mb-4 flex items-center">
            <div className="flex-1">
              <Select
                isMulti
                name="labels"
                options={labelOptions}
                className="basic-multi-select w-full"
                classNamePrefix="select"
                formatOptionLabel={formatOptionLabel}
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
                <span className="text-red-500">{formik.errors.labels}</span>
              )}
            </div>
            <button
              type="button"
              className="ml-4 p-3 rounded-full text-white"
              style={{ backgroundColor: "rgb(126 34 206)" }}
              onClick={toggleLabelModal}
            >
              <FiPlus />
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={toggleEditLabelsModal}
              aria-label="Edit Labels"
            >
              <FiEdit className="w-5 h-5" />
              <span className="font-medium">Edit Labels</span>
            </button>
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

        <AddLabelModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          toggleLabelModal={toggleLabelModal}
        />
        <EditLabelsModal
          isOpen={isEditLabelsModalOpen}
          onClose={toggleEditLabelsModal}
        />
      </div>
    </div>
  );
}
