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
    return httpClient.post(`/image/${imageId}/annotations`, {
      annotations,
    });
  } catch (error) {
    console.error("Error saving annotations:", error);
    throw error;
  }
};