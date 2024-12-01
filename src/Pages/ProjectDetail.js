import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjectsById } from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import Select from "react-select";
import { getLabels } from "../services/labelService";
import { exportProject } from "../services/projectService";
import { FiUpload, FiEdit, FiDownload } from "react-icons/fi";

export default function ProjectDetail() {
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [selectedLabels, setSelectedLabels] = useState([]);

  const token = localStorage.getItem("token"); // Replace with your token management solution

  // Fetch the project by ID
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["Projects", params.id],
    queryFn: () => getProjectsById(params.id, token), // Pass token here
  });

  // Fetch labels for filter
  const { data: labelsData } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabels,
  });

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleExport = async () => {
    try {
      await exportProject(params.id, token); // Pass token here
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export project data. Please try again.");
    }
  };

  let content;

  if (isLoading) {
    content = (
      <div className="flex justify-center py-10">
        <p className="text-lg text-gray-700">Loading project data...</p>
      </div>
    );
  }

  if (isError) {
    content = (
      <div className="py-10">
        <ErrorBlock
          title="Failed to load project"
          message={
            error.info?.message ||
            "Failed to fetch project data, please try again later"
          }
        />
      </div>
    );
  }

  if (data) {
    const project = data.data;

    const filteredImages = project.images.filter((image) =>
      selectedLabels.length
        ? image.labels.some((label) => selectedLabels.includes(label._id))
        : true
    );

    const labelOptions = labelsData?.data.map((label) => ({
      value: label._id,
      label: label.name,
    }));

    content = (
      <div className="flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">{project.name}</h1>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={handleExport}
            >
              <FiDownload />
              Export
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              <FiUpload />
              Upload Data
            </button>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={toggleModal}
            >
              <FiEdit />
              Edit
            </button>
          </div>
        </div>
        <p className="text-gray-600">{project.description}</p>

        {/* Filters Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-semibold">Columns:</label>
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                className={`px-4 py-2 rounded-md transition ${
                  selectedColumns === num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-blue-100"
                }`}
                onClick={() => setSelectedColumns(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-1/3">
            <label className="text-gray-700 font-semibold">Search Label:</label>
            <Select
              isMulti
              name="labels"
              options={labelOptions}
              className="basic-multi-select w-full"
              classNamePrefix="select"
              value={labelOptions?.filter((option) =>
                selectedLabels.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                setSelectedLabels(
                  selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : []
                )
              }
              placeholder="Search Labels"
            />
          </div>
        </div>

        {/* Images Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${selectedColumns}, minmax(0, 1fr))`,
          }}
        >
          {filteredImages.map((image) => (
            <div
              key={image._id}
              className="bg-gray-100 rounded-lg shadow overflow-hidden"
            >
              <Link to={`/edit-image/${image._id}`}>
                <img
                  src={`http://localhost:3001/` + image.filePath}
                  alt={image.fileName}
                  className="w-full h-48 object-cover"
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} toggleModal={toggleModal} />
      </div>
    );
  }

  return <div>{content}</div>;
}
