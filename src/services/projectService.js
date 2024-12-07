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

// Update an existing project by ID
export const updateProject = (projectId, data, token) => {
  return httpClient.put(`/projects/${projectId}`, data, authHeaders(token));
};

export const uploadImages = async (projectId, files, token) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file)); // Append multiple files
  const response = await httpClient.post(`/project/${projectId}/upload-images`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
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
