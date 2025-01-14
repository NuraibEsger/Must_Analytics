import { httpClient } from "../utils/httpClient";

export const getLabels = (token) => {
  return httpClient.get("/labels", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const postLabel = (data, token) => {
  return httpClient.post("/labels", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Create a label associated with a specific project
export const postLabelByProject = (projectId, data, token) => {
  console.log("data", data)
  return httpClient.post(`/projects/${projectId}/labels`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};