import React from "react";
import ReactDOM from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";

export default function ConfirmationModal({
  isOpen,
  title = "Are you sure?",
  message = "Do you want to proceed?",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
}) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <div className="flex items-center mb-4">
          <FiAlertTriangle className="text-red-500 text-3xl mr-3" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") // Ensure you have a div with id 'modal-root' in your index.html
  );
}
