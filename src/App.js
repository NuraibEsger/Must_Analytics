import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./Pages/Login";
import Root from "./layout/Root";
import Register from "./Pages/Register";
import Home from "./Pages/Home";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/httpClient";
import ProjectDetail from "./Pages/ProjectDetail";
import ImageEdit from "./Pages/ImageEdit";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/project/:id/",
        element: <ProjectDetail />,
      },
      {
        path: "/edit-image/:id", // Specify the component to be used
        element: <ImageEdit />,
      },
      {
        path: "/sign-in",
        element: <Login />,
      },
      {
        path: "/sign-up",
        element: <Register />,
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
