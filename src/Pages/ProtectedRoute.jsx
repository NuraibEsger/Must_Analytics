// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {jwtDecode} from "jwt-decode"; // Corrected import
import { logoutAction } from "../redux/slices/accountSlice";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.account.token);

  if (!token || typeof token !== "string") {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const { exp } = decoded;

    // Check if the token has expired
    if (Date.now() >= exp * 1000) {
      dispatch(logoutAction());
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Token decoding failed:", error);
    dispatch(logoutAction());
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
