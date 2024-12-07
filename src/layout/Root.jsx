import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function Root() {
  return (
    <>
      <main className="min-h-screen bg-gray-100">
        <Header />
        <div className="pt-20 container mx-auto px-6">
          {/* Ensure enough space below the fixed header */}
          <Outlet />
        </div>
      </main>
    </>
  );
}
