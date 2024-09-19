import React, { useEffect, useState } from "react";

export default function Modal({ isOpen, toggleModal }) {
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        toggleModal();
      }
    };
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [toggleModal]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  if (!isOpen) return null;

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

          {/* Custom File Upload */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Upload File
            </label>
            <div className="relative w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-purple-600">
              <input
                type="file"
                className="absolute inset-0 opacity-0 w-full h-full z-10 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-gray-500">
                  {fileName ? fileName : "Choose a file..."}
                </span>
                <button
                  type="button"
                  className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-start gap-4">
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


