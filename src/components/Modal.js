import axios from "axios";
import React, { useState } from "react";

export default function Modal({ isOpen, toggleModal }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  const upload = (e) => {
  e.preventDefault();
  const formData = new FormData();

  formData.append('name', name);
  formData.append('description', description);

  // Append multiple files
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  axios.post('http://localhost:3001/upload', formData)
    .then((res) => {
      toggleModal(); // Close modal on success
    })
    .catch((err) => {
      console.log("ASASASA");
      
      console.log(err); // Check error details here
    });
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>

        <form method="post">
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Project Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Upload Files</label>
            <input
              type="file"
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setFiles(e.target.files)}
            />
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
              onClick={upload}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
