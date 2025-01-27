import React, { useState } from "react";
import { sendInvite } from "../services/projectService"; 
import AlertModal from "./AlertModal"; // Import the new AlertModal

export default function InviteModal({ onClose, projectId }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("visitor");
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState(""); // "success" or "error"
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      
      // Example: call your invite logic
      await sendInvite(projectId, { email, role });
      // For now, we’ll just mock the behavior:
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      setAlertMessage(`Invite sent to ${email} as ${role}!`);
      setAlertType("success");
      setIsAlertOpen(true);
      setTimeout(() => {
        onClose();
        setIsAlertOpen(false);
      }, 2000); // Close after 2 seconds
    } catch (error) {
      console.error("Error sending invite:", error);
      // Show error message
      setAlertMessage("Failed to send invite. Please try again.");
      setAlertType("error");
      setIsAlertOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
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

          {/* Actions */}
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

      {/* Show the AlertModal after the invite process */}
      {isAlertOpen && (
        <AlertModal
          message={alertMessage}
          onClose={() => setIsAlertOpen(false)}
          type={alertType}
        />
      )}
    </>
  );
}
