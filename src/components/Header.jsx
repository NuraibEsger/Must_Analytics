import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutAction } from "../redux/slices/accountSlice";
import { useNavigate } from "react-router-dom";
import { FiHome, FiLogOut, FiLogIn, FiArrowLeft } from "react-icons/fi";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, email } = useSelector((state) => state.account);

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate("/login"); // Optionally redirect to login page after logout
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 shadow-md flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
        >
          <FiHome />
          Home
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
        >
          <FiArrowLeft />
          Go Back
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {token ? (
          <>
            <span className="font-semibold text-lg">{email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
            >
              <FiLogOut />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
          >
            <FiLogIn />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
