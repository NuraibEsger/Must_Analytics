import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "../services/authService";

export default function Register() {
    const navigate = useNavigate();
  
    const mutation = useMutation({
      mutationFn: signUp,
      onSuccess: () => {
        navigate("/login");
      },
      onError: (error) => {
        console.error("Registration failed: ", error);
        alert("Registration failed. Please try again.");
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
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Required"),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password"), null], "Passwords must match")
          .required("Required"),
      }),
      onSubmit: (values) => {
        mutation.mutate(values);
      },
    });
  
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Register</h2>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                className={`w-full px-4 py-2 border rounded-lg ${
                  formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"
                }`}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
              ) : null}
            </div>
  
            <div>
              <label className="block text-lg font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                className={`w-full px-4 py-2 border rounded-lg ${
                  formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"
                }`}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.password && formik.errors.password ? (
                <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
              ) : null}
            </div>
  
            <div>
              <label className="block text-lg font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`w-full px-4 py-2 border rounded-lg ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>
              ) : null}
            </div>
  
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Register
            </button>
          </form>
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-blue-500 hover:text-blue-700"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }