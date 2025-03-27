import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./layout/Root";
import Home from "./Pages/Home";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./utils/httpClient";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProtectedRoute from "./Pages/ProtectedRoute";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import NotFound from "./Pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import AcceptInvite from "./components/AcceptInvite";
import ImageEdit from "./Pages/ImageEdit";
import { lazy, Suspense } from "react";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPasswordPage from "./Pages/ResetPasswordPage";

const ProjectDetail = lazy(() => import("./Pages/ProjectDetail"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },,
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },,
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/project/:id/",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <ProjectDetail />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/edit-image/:id",
        element: (
          <ProtectedRoute>
            <ImageEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "/accept-invite",
        element: (
          <ProtectedRoute>
            <AcceptInvite />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </QueryClientProvider>
  );
}

export default App;
