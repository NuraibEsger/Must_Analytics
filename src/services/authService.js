// authService.js
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
    const response = await httpClient.post("/signUp", {
      email,
      password,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Signup failed" };
  }
};

export const forgotPassword = async ({ email }) => {
  try {
    const response = await httpClient.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Forgot password failed" };
  }
};

export const resetPassword = async ({ token, password, confirmPassword }) => {
  try {
    const response = await httpClient.post("/reset-password", { token, password, confirmPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Reset password failed" };
  }
};