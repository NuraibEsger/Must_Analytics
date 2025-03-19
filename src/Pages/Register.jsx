import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { signUp } from "../services/authService";
import { toast } from "react-toastify";

export default function Register() {
  const [modalOpen, setModalOpen] = useState(true);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    },
    onError: (error) => {
      let errorMessage = "Registration failed. Please try again.";
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
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "auto";
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <div className="relative min-h-screen">
      {/* Full-Screen Background with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1834&q=80" 
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center px-4 transition-all duration-500">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full transform scale-100">
            <div className="flex flex-col md:flex-row">
              {/* Registration Form */}
              <div className="p-8 md:w-2/5">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Create Account
                </h1>
                <p className="text-gray-500 mb-6">
                  Join our community and start your journey.
                </p>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="you@example.com"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {formik.errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="********"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {formik.errors.password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      placeholder="********"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {formik.errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={mutation.isLoading}
                    className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                  >
                    {mutation.isLoading ? "Registering..." : "Register"}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <span className="text-gray-600 text-sm">
                    Already have an account?
                  </span>
                  <button
                    onClick={() => navigate("/login")}
                    className="ml-2 text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Image Side */}
              <div className="hidden md:block md:w-3/5 relative">
                <img
                  src="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1000&q=80"
                  alt="Register Visual"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent"></div>
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
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
