import { useState } from "react";
import { useProjectForm } from "../hooks/useProjectForm";
import AddLabelModal from './AddLabelModal'

export default function Modal({ isOpen, toggleModal }) {
  const { formik, handleFileChange, isSubmitting } =
    useProjectForm(toggleModal);

  const [isModalOpen, setModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>

        <form method="post">
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

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Labels</label>
            <div className="v-input v-input--dense theme--light v-text-field v-select v-select--chips v-select--is-multi">
              <div className="v-input__control">
                <div
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  className="v-input__slot"
                >
                  <div className="v-select__slot">
                    <input
                      required="required"
                      id="input-3911"
                      type="text"
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Add labels"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button
                type="button"
                className="v-btn v-btn--icon v-btn--round"
                onClick={() => setModalOpen(true)}
              >
                <span className="v-btn__content">Add Label</span>
              </button>

              <AddLabelModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
              />
            </div>
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
              onClick={formik.handleSubmit}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
