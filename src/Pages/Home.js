import React, { useState } from "react";
import Modal from "../components/Modal";
import Container from "../components/Container";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Section with Modal */}
      <div className="w-full flex justify-center px-4 pt-12 md:px-6">
        <div className="relative overflow-hidden p-8 md:py-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white w-full max-w-4xl shadow-lg">
          <div className="flex flex-wrap items-center justify-between">
            {/* Title and Description */}
            <div className="flex mb-4 md:mb-0 md:pl-8 w-full md:w-auto">
              <div>
                <h1 className="font-bold text-2xl md:text-4xl">Image Classification</h1>
                <p className="mt-2 md:mt-4 font-light text-sm md:text-base leading-tight">
                  Localization & Segmentation
                </p>
              </div>
            </div>

            {/* Button to Toggle Modal */}
            <div className="flex justify-center sm:justify-start w-full sm:w-auto md:w-1/4">
              <button
                type="button"
                className="bg-white text-purple-700 border border-white rounded-full px-5 py-2 flex items-center hover:bg-purple-600 hover:text-white transition duration-200"
                onClick={toggleModal}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-hidden="true"
                  className="w-5 h-5 mr-2"
                >
                  <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"></path>
                </svg>
                Add Project
              </button>
            </div>
          </div>
        </div>

        {/* Modal Component */}
        <Modal isOpen={isModalOpen} toggleModal={toggleModal} />
      </div>

      {/* Card Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6">
        {/* Render Cards 3x3 */}
        <Container />
        <Container />
        <Container />
        <Container />
        <Container />
        <Container />
        <Container />
        <Container />
        <Container />
      </div>
    </div>
  );
}
