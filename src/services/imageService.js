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
    return await httpClient.post(`/image/${imageId}/annotations`, { annotations });
  } catch (error) {
    console.error("Error saving annotations:", error);
    throw error;
  }
};

export const updateAnnotation = async (annotationId, data) => {
  try {
    return await httpClient.patch(`/annotations/${annotationId}`, data);
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

export const updateAnnotationLabel = async (annotationId, labelId) => {
  try {
    const response = await httpClient.patch(`/annotations/${annotationId}/label`, { labelId });
    return response.data;
  } catch (error) {
    console.error("Error updating annotation label:", error);
    throw error;
  }
};

// Delete a single annotation.
export const deleteAnnotation = async (annotationId) => {
  try {
    const response = await httpClient.delete(`/annotations/${annotationId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting annotation:", error);
    throw error;
  }
};