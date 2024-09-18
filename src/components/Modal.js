// Modal.jsx
import React, { useEffect } from "react";

export default function Modal({ isOpen, toggleModal }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        toggleModal();
      }
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
        document.removeEventListener('keydown', handleEsc);
      };
  }, [toggleModal]);


  if (!isOpen) return null; // If modal is not open, don't render it.

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>

        {/* Form */}
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Project Name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Project Description"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Upload File
            </label>
            <input
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              onClick={toggleModal}
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
