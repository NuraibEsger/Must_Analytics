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
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1538137524007-21e48fa42f3f?ixlib=rb-0.3.5&auto=format&fit=crop&w=1834&q=80)",
        }}
      ></div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 transition duration-300">
        <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full relative">
          <div className="flex flex-col md:flex-row">
            {/* Modal Left - Login Form */}
            <div className="p-10 mr-4 md:w-2/5">
              <h1 className="text-2xl font-semibold my-4 mb-10 text-amber-700">
                Welcome!
              </h1>
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
                    <p className="text-red-500 text-sm mt-1">
                      {formik.errors.email}
                    </p>
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
                    <p className="text-red-500 text-sm mt-1">
                      {formik.errors.password}
                    </p>
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
                <a
                  href="/register"
                  className="text-amber-600 hover:text-amber-800"
                >
                  Sign up now
                </a>
              </p>
            </div>

            {/* Modal Right - Image */}
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
