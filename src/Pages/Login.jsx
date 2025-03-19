import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { useDispatch } from "react-redux";
import { login } from "../services/authService";
import { loginAction } from "../redux/slices/accountSlice";
import { toast } from "react-toastify";

export default function Login() {
  const [modalOpen, setModalOpen] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      dispatch(loginAction({ token: data.token, email: data.email }));
      toast.success("Logged in successfully!");
      navigate("/");
    },
    onError: (error) => {
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  // Immediately show the modal (disable scrolling if needed)
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1538137524007-21e48fa42f3f?ixlib=rb-0.3.5&auto=format&fit=crop&w=1834&q=80)',
        }}
      ></div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 transition duration-300">
          <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full relative">
            <div className="flex flex-col md:flex-row">
              {/* Modal Left - Login Form */}
              <div className="p-10 mr-4 md:w-2/5">
                <h1 className="text-2xl font-semibold my-4 mb-10 text-amber-700">Welcome!</h1>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs uppercase font-semibold text-amber-600"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:border-amber-500"
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs uppercase font-semibold text-amber-600"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:border-amber-500"
                    />
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <a
                      href="/forgot-password"
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Forgot your password?
                    </a>
                    <button
                      type="submit"
                      disabled={mutation.isLoading}
                      className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 transition"
                    >
                      {mutation.isLoading ? "Signing In..." : "Login"}
                    </button>
                  </div>
                </form>
                <p className="mt-4 text-center text-sm">
                  Don't have an account?{" "}
                  <a href="/register" className="text-amber-600 hover:text-amber-800">
                    Sign up now
                  </a>
                </p>
              </div>

              {/* Modal Right - Image */}
              <div className="hidden md:block md:w-3/5">
                <img
                  src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-0.3.5&auto=format&fit=crop&w=1000&q=80"
                  alt="Login Visual"
                  className="w-full h-full object-cover transform scale-110 transition duration-700"
                />
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 bg-transparent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 50 50"
                className="w-6 h-6"
              >
                <path d="M25 3C12.8616 3 3 12.8616 3 25C3 37.1384 12.8616 47 25 47C37.1384 47 47 37.1384 47 25C47 12.8616 37.1384 3 25 3zM25 5C36.0575 5 45 13.9425 45 25C45 36.0575 36.0575 45 25 45C13.9425 45 5 36.0575 5 25C5 13.9425 13.9425 5 25 5zM16.99 15.99a1 1 0 0 0-.697 1.717l7.293 7.293-7.293 7.293a1 1 0 1 0 1.414 1.414l7.293-7.293 7.293 7.293a1 1 0 1 0 1.414-1.414l-7.293-7.293 7.293-7.293A1 1 0 0 0 33 25a1 1 0 0 0-.293-.707L25.414 16.99 16.99 25.414A1 1 0 0 0 16.99 15.99z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
