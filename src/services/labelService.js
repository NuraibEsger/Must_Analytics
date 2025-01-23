import { httpClient } from "../utils/httpClient";

export const getLabels = (token) => {
  return httpClient.get("/labels", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getLabelsByProjectId = async (projectId) => {
  try {
    const response = await httpClient.get(`/labels/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching labels by project ID:", error);
    throw error;
  }
};

export const postLabel = (data, token) => {
  return httpClient.post("/labels", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateLabel = (labelId, data, token) => {
  return httpClient.put(`/labels/${labelId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Create a label associated with a specific project
export const postLabelByProject = (projectId, data, token) => {
  return httpClient.post(`/projects/${projectId}/labels`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};