import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function Root() {
  return (
    <>
      <main className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <div className="flex-1 overflow-hidden">
          {/* Ensure enough space below the fixed header */}
          <Outlet />
        </div>
      </main>
    </>
  );
}
