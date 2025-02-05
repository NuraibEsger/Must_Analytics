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
export const getProjectsById = async (projectId, token) => {
  try {
    const response = await httpClient.get(`/project/${projectId}`, authHeaders(token));
    return response.data; // Return the actual project data directly
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    throw error;
  }
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

export const deleteImage = async (projectId, imageId, token) => {
  try {
    const response = await httpClient.delete(`/project/${projectId}/image/${imageId}`, authHeaders(token));

    return response.data;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

// Update an existing project by ID
export const updateProject = (projectId, data, token) => {
  if (!projectId) {
    console.error("Error: projectId is undefined or null");
    throw new Error("Project ID is required");
  }

  try {
    return httpClient.put(`/projects/${projectId}`, data, authHeaders(token));
  } catch (error) {
    console.error("Error updating project:", error);
  }
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

// Send project invite
export const sendInvite  = async (projectId, { email, role }, token) => {
  return httpClient.post(`/project/${projectId}/invite`, {email, role}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const acceptInvite = async (token) => {
  return httpClient.post(`/project/accept-invite`, {token});
}

export const updateProjectMemberRole = async ({ projectId, email, role }, token) => {
  return httpClient.put(`/project/${projectId}/members`, { email, role }, authHeaders(token));
}
