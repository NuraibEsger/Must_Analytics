// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from 'jwt-decode';
import { logoutAction } from "../redux/slices/accountSlice";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.account.token);
  const decoded = jwtDecode(token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Decode the token if it's a JWT
  try {
    const { exp } = decoded;
    const isExpired = Date.now() >= exp * 1000;
    if (isExpired) {
      dispatch(logoutAction());
      return <Navigate to="/login" />;
    }
  } catch (e) {
    // If decoding fails, assume invalid token
    dispatch(logoutAction());
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
