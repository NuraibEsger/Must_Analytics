import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";

export default function Root() {
  const location = useLocation();
  const isLoginOrRegisterPage =
    location.pathname.includes("login") || location.pathname.includes("register");

  return (
    <>
      <main className="flex flex-col min-h-screen bg-gray-100">
        {!isLoginOrRegisterPage && <Header />}
        <div className="flex-1 overflow-auto">
          {/* Now scroll is enabled */}
          <Outlet />
        </div>
      </main>
    </>
  );
}
