import React from 'react';
import { useLabelForm } from '../hooks/useLabelForm';

const AddLabelModal = ({ isOpen, onClose, toggleLabelModal }) => {
  const { formik, isSubmitting } = useLabelForm(toggleLabelModal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{zIndexL: 1000}}>
      {/* Changed from form to div */}
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="d-flex justify-space-between align-center">
          <h2 className="font-weight-bold">Add Label</h2>
          <button
            type="button"
            className="v-btn v-btn--icon v-btn--round"
            onClick={onClose}
          >
            <span aria-hidden="true" className="v-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
              </svg>
            </span>
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor='name' className="block mb-2">Name</label>
          <input
            required
            type="text"
            name="name"
            id='name'
            value={formik.values.name}
            onChange={formik.handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {formik.errors.name && formik.touched.name && (
            <span style={{ color: "red" }}>{formik.errors.name}</span>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor='color' className="block mb-2">Color</label>
          <input
            name='color'
            type="color"
            id='color'
            value={formik.values.color}
            onChange={formik.handleChange}
            className="w-full h-32 border border-gray-300 rounded-md"
          />
          {formik.errors.color && formik.touched.color && (
            <span style={{ color: "red" }}>{formik.errors.color}</span>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-purple-700 text-white px-4 py-2 rounded-md"
            onClick={formik.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLabelModal;
