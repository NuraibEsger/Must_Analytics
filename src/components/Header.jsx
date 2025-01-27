import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutAction } from "../redux/slices/accountSlice";
import { useMatch, useNavigate } from "react-router-dom";
import { FiHome, FiLogOut, FiLogIn, FiArrowLeft } from "react-icons/fi";
import logo from "../images/image.png"; // Import your logo image here

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const match = useMatch("/edit-image/:id");
  const isEditImagePage = Boolean(match);

  const { token, email } = useSelector((state) => state.account);

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 shadow-md flex justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Logo Section */}
        <img src={logo} alt="Logo" className="h-8 w-auto" />
        
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
        >
          <FiHome />
          Home
        </button>
        {isEditImagePage && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
          >
            <FiArrowLeft />
            Go Back
          </button>
        )}
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
