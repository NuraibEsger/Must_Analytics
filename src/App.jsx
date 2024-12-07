import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./layout/Root";
import Home from "./Pages/Home";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/httpClient";
import ProjectDetail from "./Pages/ProjectDetail";
import ImageEdit from "./Pages/ImageEdit";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProtectedRoute from "./Pages/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
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
            <ImageEdit />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
