import { httpClient } from "../utils/httpClient";

export const login = async ({ email, password }) => {
  try {
    const response = await httpClient.post("/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const signUp = async ({ email, password, confirmPassword }) => {
  try {
    const response = await httpClient.post("/signUp", { email, password, confirmPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Signup failed" };
  }
};
