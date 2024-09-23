import React, { useState } from 'react';

const AddLabelModal = ({ isOpen, onClose }) => {
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#000000'); // Default color

  const handleSave = () => {
    // Logic to save the label
    console.log('Saving label:', labelName, labelColor);
    // Reset form
    setLabelName('');
    setLabelColor('#000000');
    onClose(); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="d-flex justify-space-between align-center">
          <h2 className="font-weight-bold">Add Label</h2>
          <button type="button" className="v-btn v-btn--icon v-btn--round" onClick={onClose}>
            <span aria-hidden="true" className="v-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
              </svg>
            </span>
          </button>
        </div>

        <div className="mt-4">
          <label className="block mb-2">Name</label>
          <input
            required
            type="text"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block mb-2">Color</label>
          <input
            type="color"
            value={labelColor}
            onChange={(e) => setLabelColor(e.target.value)}
            className="w-full h-32 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-between mt-4">
          <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded-md" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bg-purple-700 text-white px-4 py-2 rounded-md" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLabelModal;