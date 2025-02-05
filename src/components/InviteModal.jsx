import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  sendInvite,
  getProjectsById,
  updateProjectMemberRole,
} from "../services/projectService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InviteModal({ onClose, projectId }) {
  // Local state for the invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("visitor");
  const [isLoading, setIsLoading] = useState(false);

  // Get the authentication token from Redux (if needed)
  const token = useSelector((state) => state.account.token);

  // React Query client instance for invalidation
  const queryClient = useQueryClient();

  // Fetch the project details to display current members
  const {
    data: projectData,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery(["ProjectDetail", projectId], () => getProjectsById(projectId, token));

  // Mutation for updating a member’s role
  const updateMutation = useMutation(
    ({ email, role }) => updateProjectMemberRole({ projectId, email, role }, token),
    {
      onSuccess: () => {
        toast.success("Member role updated successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
        queryClient.invalidateQueries(["ProjectDetail", projectId]);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update member role.", {
          position: "top-right",
          autoClose: 2000,
        });
      },
    }
  );

  // Handler for sending a new invite
  const handleInvite = async () => {
    try {
      setIsLoading(true);
      // Send the invite. Note: the invite endpoint should not allow inviting with role "owner".
      await sendInvite(projectId, { email: inviteEmail, role: inviteRole }, token);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Invite sent to ${inviteEmail} as ${inviteRole}!`, {
        position: "top-right",
        autoClose: 2000,
      });
      // Clear the input fields
      setInviteEmail("");
      setInviteRole("visitor");
      // Refresh the project details so that the members list updates
      queryClient.invalidateQueries(["ProjectDetail", projectId]);
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

  // Handler for changing the role of an existing member.
  // Only "visitor" and "editor" are allowed.
  const handleRoleChange = (memberEmail, newRole) => {
    updateMutation.mutate({ email: memberEmail, role: newRole });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Invite to Project</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Invite Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter user email"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-500"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-500"
            >
              {/* Do not allow sending invites with role "owner" */}
              <option value="visitor">Visitor</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>

          <hr className="my-6" />

          {/* Members List */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Members</h3>
          {membersLoading ? (
            <div className="text-center text-gray-600">Loading members…</div>
          ) : membersError ? (
            <div className="text-center text-red-500">Error loading members.</div>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {projectData?.data?.members?.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar Icon */}
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.121 17.804A13.937 13.937 0 0112 15c2.483 0 4.798.664 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.role === "owner"
                          ? "Owner"
                          : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </p>
                    </div>
                  </div>
                  {member.role === "owner" ? (
                    <div className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">Owner</div>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.email, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                    >
                      <option value="visitor">Visitor</option>
                      <option value="editor">Editor</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Toast Container for Notifications */}
      <ToastContainer />
    </>
  );
}
