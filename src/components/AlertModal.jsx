import React from "react";

const AlertModal = ({ message, onClose, type }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white p-6 rounded shadow-md w-full max-w-sm relative ${
          type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-4">Invite Status</h2>
        <p className="text-white">{message}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
