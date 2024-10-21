import { httpClient } from "../utils/httpClient";

// Get all projects
export const getProjects = (token) => {
  return httpClient.get("/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Create a new project
export const postProject = (data, token) => {
  return httpClient.post("/projects", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get a project by ID
export const getProjectsById = (projectId, token) => {
  return httpClient.get(`/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Update an existing project by ID
export const updateProject = (projectId, data, token) => {
  return httpClient.put(`/projects/${projectId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`, // Optional: Token for authentication
    },
  });
};

// Export a project by ID
export const exportProject = async (projectId, token) => {
  const response = await httpClient.get(`/projects/${projectId}/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: "blob", 
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  link.setAttribute("download", `project_${projectId}_data.json`); // Adjust filename and extension as needed
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};