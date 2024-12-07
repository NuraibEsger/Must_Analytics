import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutAction } from "../redux/slices/accountSlice"
import { useNavigate } from "react-router-dom";
import { FiHome, FiLogOut } from "react-icons/fi";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userName = useSelector((state) => state.account.userName);

  const handleLogout = () => {
    dispatch(logoutAction());
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 shadow-md flex justify-between items-center">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-blue-600 hover:bg-blue-100 rounded-md font-medium"
      >
        <FiHome />
        Home
      </button>
      <div className="flex items-center space-x-4">
        <span className="font-semibold text-lg">{userName}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
        >
          <FiLogOut />
          Logout
        </button>
      </div>

    </header>
  );
}
