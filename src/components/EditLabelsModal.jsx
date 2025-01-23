import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { getLabels, updateLabel } from "../services/labelService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function EditLabelsModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.account.token);

  // Fetch labels
  const { data, isLoading, isError } = useQuery(
    ["labels"],
    () => getLabels(token),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      enabled: isOpen, // Only fetch if modal is open
    }
  );

  // Mutation for updating label
  const updateLabelMutation = useMutation(
    ({ labelId, name, color }) => updateLabel(labelId, { name, color }, token),
    {
      onMutate: async ({ labelId, name, color }) => {
        await queryClient.cancelQueries(["labels"]);

        const previousLabels = queryClient.getQueryData(["labels"]);

        queryClient.setQueryData(["labels"], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((label) =>
              label._id === labelId ? { ...label, name, color } : label
            ),
          };
        });

        return { previousLabels };
      },
      onError: (err, variables, context) => {
        if (context?.previousLabels) {
          queryClient.setQueryData(["labels"], context.previousLabels);
        }
        toast.error("Failed to update label.");
      },
      onSuccess: () => {
        toast.success("Label updated successfully.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["labels"]);
      },
    }
  );

  // Local state to manage editable fields
  const [editableLabels, setEditableLabels] = useState([]);

  // Initialize editableLabels when data is fetched
  React.useEffect(() => {
    if (data && data.data) {
      setEditableLabels(data.data);
    }
  }, [data]);

  // Handle changes in label name
  const handleNameChange = (id, newName) => {
    setEditableLabels((prev) =>
      prev.map((label) =>
        label._id === id ? { ...label, name: newName } : label
      )
    );
  };

  // Handle changes in label color
  const handleColorChange = (id, newColor) => {
    setEditableLabels((prev) =>
      prev.map((label) =>
        label._id === id ? { ...label, color: newColor } : label
      )
    );
  };

  // Handle save button click
  const handleSave = () => {
    editableLabels.forEach((label) => {
      const originalLabel = data.data.find((l) => l._id === label._id);
      if (originalLabel.name !== label.name || originalLabel.color !== label.color) {
        updateLabelMutation.mutate({
          labelId: label._id,
          name: label.name,
          color: label.color,
        });
      }
    });
    onClose();
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-labels-modal-title"
      >
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-labels-modal-title"
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-lg" role="document">
          <h2 id="edit-labels-modal-title" className="text-xl font-bold mb-4">
            Edit Labels
          </h2>
          <p className="text-red-500">Failed to load labels.</p>
          <button
            type="button"
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-labels-modal-title"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 id="edit-labels-modal-title" className="text-xl font-bold mb-4">
          Edit Labels
        </h2>

        <div className="space-y-4 max-h-80 overflow-y-auto">
          {editableLabels.map((label) => (
            <div key={label._id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className="w-6 h-6 rounded-full mr-3"
                  style={{ backgroundColor: label.color }}
                ></span>
                <input
                  type="text"
                  value={label.name}
                  onChange={(e) => handleNameChange(label._id, e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <input
                type="color"
                value={label.color}
                onChange={(e) => handleColorChange(label._id, e.target.value)}
                className="w-40 h-10 p-0 border-none cursor-pointer"
                title="Choose label color"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition-colors"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
