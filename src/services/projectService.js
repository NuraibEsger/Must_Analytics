import { httpClient } from "../utils/httpClient";

export const getProjects = (token) => {
  return httpClient.get("/projects");
};

export const postProject = (data, token) => {
  
  return httpClient.post("/projects", data);
};

export const getProjectsById = (projectId, token) => {
  return httpClient.get(`/project/${projectId}`);
};
