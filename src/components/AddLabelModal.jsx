import React from "react";
import { useLabelForm } from "../hooks/useLabelForm";
import { neonColors } from "../utils/colorUtils";
import { FiX } from "react-icons/fi";

const AddLabelModal = ({ isOpen, onClose, toggleLabelModal, projectId = null }) => {
  const { formik, isSubmitting } = useLabelForm(toggleLabelModal, projectId);

  if (!isOpen) return null;

  // Close modal if click occurs on the overlay (outside the modal content)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleNeonColorSelect = (color) => {
    formik.setFieldValue("color", color);
  };

  return (
    <div
      id="modal-overlay"
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      style={{ zIndex: 1000 }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-xl">Add Label</h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close Modal"
          >
            <FiX size={30} color="#b02a30" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Label Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Label Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              value={formik.values.name}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {formik.touched.name && formik.errors.name ? (
              <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
            ) : null}
          </div>

          {/* Neon Color Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommended Neon Colors
            </label>
            <div className="flex space-x-3 mb-4">
              {neonColors.map((color) => {
                const isSelected = formik.values.color === color.hex;
                return (
                  <button
                    type="button"
                    key={color.hex}
                    onClick={() => handleNeonColorSelect(color.hex)}
                    className={`w-10 h-10 rounded-full border-2 focus:outline-none transition-transform transform ${
                      isSelected
                        ? "border-indigo-600 scale-110 hover:shadow-xl" // When selected, add a shadow on hover.
                        : "border-transparent hover:scale-105" // When not selected, use a scale effect.
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={`Select ${color.name}`}
                  >
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-gray-700"
            >
              Label Color
            </label>
            <input
              id="color"
              name="color"
              type="color"
              onChange={formik.handleChange}
              value={formik.values.color}
              className="mt-1 block w-full h-10 p-0 border-0 rounded-md shadow-sm cursor-pointer"
              required
            />
            {formik.touched.color && formik.errors.color ? (
              <p className="mt-1 text-sm text-red-600">{formik.errors.color}</p>
            ) : null}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Label"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLabelModal;
