import { httpClient } from "../utils/httpClient";

// Helper function to get Authorization header
const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get all projects
export const getProjects = (token) => {
  return httpClient.get("/projects", authHeaders(token));
};

// Create a new project
export const postProject = (data, token) => {
  return httpClient.post("/projects", data, authHeaders(token));
};

// Get a project by ID
export const getProjectsById = (projectId, token) => {
  return httpClient.get(`/project/${projectId}`, authHeaders(token));
};

// Fetch images with pagination
export const getProjectImages = (projectId, token, skip = 0, limit = 50) => {
  return httpClient
    .get(`/project/${projectId}/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        skip,
        limit,
      },
    })
    .then((response) => response.data); // Ensure you return the data object directly
};

export const deleteProject = (projectId, token) => {
  return httpClient.delete(`/projects/${projectId}`, authHeaders(token));
};

// Update an existing project by ID
export const updateProject = (projectId, data, token) => {
  if (!projectId) {
    console.error("Error: projectId is undefined or null");
    throw new Error("Project ID is required");
  }

  return httpClient.put(`/projects/${projectId}`, data, authHeaders(token));
};

export const uploadImages = (projectId, formData, token) => {
  return httpClient.post(`/project/${projectId}/upload-images`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// Export a project by ID
export const exportProject = async (projectId, token) => {
  try {
    const response = await httpClient.get(`/projects/${projectId}/export`, {
      ...authHeaders(token),
      responseType: "blob", // To handle file download
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `project_${projectId}_data.json`); // Set filename and extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting project:", error);
  }
};

// Fetch project statistics
export const getProjectStatistics = async (projectId, token) => {
  const response = await httpClient.get(`/project/${projectId}/statistics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
