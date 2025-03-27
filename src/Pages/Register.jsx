import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { signUp } from "../services/authService";
import { toast } from "react-toastify";

export default function Register() {
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

  return (
    <div className="relative min-h-screen">
      {/* Full-Screen Background with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1834&q=80" 
          alt="New Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Modal Overlay */}
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
                src="https://www.musts.io/assets/images/content/logo-1.png"
                alt="Register Visual"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
