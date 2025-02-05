import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { useDispatch } from "react-redux";
import { login } from "../services/authService";
import { loginAction } from "../redux/slices/accountSlice";
import { toast } from "react-toastify";

export default function Login() {
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

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
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

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            disabled={mutation.isLoading} // Disable button while loading
          >
            {mutation.isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/register")}
            className="text-blue-500 hover:text-blue-700"
          >
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
