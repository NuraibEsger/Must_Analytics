// src/components/AddLabelModal.jsx

import React from 'react';
import { useLabelForm } from '../hooks/useLabelForm';

const AddLabelModal = ({ isOpen, onClose, toggleLabelModal, projectId = null }) => {
  const { formik, isSubmitting } = useLabelForm(toggleLabelModal, projectId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{ zIndex: 1000 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-xl">Add Label</h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close Modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="mt-4">
          <div className="mb-4">
            <label htmlFor='name' className="block mb-2">Name</label>
            <input
              required
              type="text"
              name="name"
              id='name'
              value={formik.values.name}
              onChange={formik.handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Label Name"
            />
            {formik.errors.name && formik.touched.name && (
              <span className="text-red-500 text-sm">{formik.errors.name}</span>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor='color' className="block mb-2">Color</label>
            <input
              name='color'
              type="color"
              id='color'
              value={formik.values.color}
              onChange={formik.handleChange}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
            {formik.errors.color && formik.touched.color && (
              <span className="text-red-500 text-sm">{formik.errors.color}</span>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
              onClick={onClose}
            >
              Cancel
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
};

export default AddLabelModal;
