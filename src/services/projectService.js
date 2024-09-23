import { httpClient } from "../utils/httpClient";

export const getProjects = (token) => {
  return httpClient.get("/projects");
};

export const postProject = (data, token) => {
  console.log('ez');
  
  return httpClient.post("/projects", data);
};

export const deleteDepartment = (projectId, token) => {
  return httpClient.delete(`/project/${projectId}`);
};
