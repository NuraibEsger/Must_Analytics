import { httpClient } from "../utils/httpClient";

export const getImageById = async (id) => {
  try {
    const response = await httpClient.get(`/image/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching image by ID:", error);
    throw error;
  }
};

export const saveAnnotations = async (imageId, annotations) => {
  try {
    return httpClient.post(`/image/${imageId}/annotations`, { annotations });
  } catch (error) {
    console.error("Error saving annotations:", error);
    throw error;
  }
};

export const deleteImage = async (projectId, imageId, token) => {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/projects/${projectId}/images/${imageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete image.");
  }

  return response.json();
};