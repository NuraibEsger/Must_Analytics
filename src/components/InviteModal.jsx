import React, { useState } from "react";
import { sendInvite } from "../services/projectService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InviteModal({ onClose, projectId }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("visitor");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      await sendInvite(projectId, { email, role });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Invite sent to ${email} as ${role}!`, {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite. Please try again.", {
        position: "top-right",
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white p-6 rounded shadow-md w-full max-w-sm relative">
          <h2 className="text-xl font-bold mb-4">Invite to Project</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="border border-gray-300 rounded w-full p-2 focus:outline-none"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className="border border-gray-300 rounded w-full p-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="visitor">Visitor</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Container to render toast notifications */}
      <ToastContainer />
    </>
  );
}
