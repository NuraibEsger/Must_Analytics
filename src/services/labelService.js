import { httpClient } from "../utils/httpClient";

export const getLabels = (token) => {
  return httpClient.get("/labels");
};

export const postLabel = (data, token) => {
  return httpClient.post("/labels", data);
};