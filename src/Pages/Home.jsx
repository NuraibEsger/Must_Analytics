import React, { useState, Suspense } from "react";
import Modal from "../components/Modal";

const Card = React.lazy(() => import("../components/Card"));

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 mx-auto container">
      <div className="w-full flex justify-center">
        {/* Increased banner width from max-w-4xl to max-w-6xl */}
        <div className="relative overflow-hidden p-6 md:py-12 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-full max-w shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Title and Description */}
            <div className="mb-4 md:mb-0">
              <h1 className="font-extrabold text-2xl md:text-4xl">
                Image Classification
              </h1>
              <p className="mt-2 md:mt-4 text-sm md:text-base">
                Advanced Localization &amp; Segmentation
              </p>
            </div>

            {/* Add Project Button */}
            <div className="flex justify-center">
              <button
                type="button"
                className="flex items-center bg-white text-purple-700 border border-transparent rounded-full px-5 py-2 shadow-md hover:bg-purple-100 transition duration-300"
                onClick={toggleModal}
                aria-label="Add Project"
                title="Add a new project"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Project
              </button>
            </div>
          </div>
        </div>
        {/* Modal Component */}
        <Modal isOpen={isModalOpen} toggleModal={toggleModal} />
      </div>

      {/* Render Cards with Suspense */}
      <Suspense fallback={<div>Loading Projects...</div>}>
        <Card />
      </Suspense>
    </div>
  );
}
