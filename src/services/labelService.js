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