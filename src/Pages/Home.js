import { useState } from "react";
import Modal from "../components/Modal";
import Card from "../components/Card";


export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  return (
    <div className="flex flex-col gap-5">
      <div className=" w-full flex justify-center px-3 pt-12 md:px-6">
        <div className="relative overflow-hidden p-6 md:py-12 rounded-lg bg-purple-700 text-white w-full max-w-4xl">
          <div className="flex flex-wrap relative z-10 items-center justify-between">
            {/* Title and Description */}
            <div className="flex mb-3 sm:mb-0 md:pl-12 w-full md:w-auto">
              <div>
                <h1 className="font-black text-xl md:text-3xl">
                  Image Classification
                </h1>
                <p className="mb-0 mt-1 md:mt-5 font-light text-sm leading-tight">
                  Localization &amp; Segmentation
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="flex justify-center sm:justify-start w-full sm:w-auto md:w-1/4">
              <button
                type="button"
                className="bg-transparent text-white border border-white rounded-full px-4 py-2 flex items-center hover:bg-white hover:text-purple-700 transition"
                onClick={toggleModal}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-hidden="true"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    fill="currentColor"
                    d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                  ></path>
                </svg>
                Add Project
              </button>
            </div>
          </div>
        </div>
        {/* Modal Component */}
        <Modal isOpen={isModalOpen} toggleModal={toggleModal} />
      </div>
      
        {/* Render Cards 3x3 */}
        <Card />
    </div>
  );
}
