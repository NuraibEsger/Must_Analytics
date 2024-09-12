import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Login from "./Pages/Login";
import Root from "./layout/Root";
import Register from "./Pages/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Navigate to="/sign-in" replace />, // Redirect root to sign-in
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
  return <RouterProvider router={router} />;
}

export default App;
