import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./layout/Root";
import Home from "./Pages/Home";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./utils/httpClient";
import ProjectDetail from "./Pages/ProjectDetail";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProtectedRoute from "./Pages/ProtectedRoute";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import NotFound from "./Pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import AcceptInvite from "./components/AcceptInvite";
import { lazy, Suspense } from "react";

const ImageEdit = lazy(() => import("./Pages/ImageEdit"));

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
            <ProjectDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/edit-image/:id",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading image editor...</div>}>
              <ImageEdit />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/accept-invite",
        element: (
          <ProtectedRoute>
            <AcceptInvite />
          </ProtectedRoute>
        )
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
