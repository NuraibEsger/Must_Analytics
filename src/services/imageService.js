import { httpClient } from "../utils/httpClient";

export const getImageById = (id) => {
    
  return httpClient.get(`/image/${id}`);
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