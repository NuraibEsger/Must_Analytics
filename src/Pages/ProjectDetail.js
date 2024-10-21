import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjectsById } from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import Select from "react-select";
import { getLabels } from "../services/labelService";
import { exportProject } from "../services/projectService";

export default function ProjectDetail() {
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [selectedLabels, setSelectedLabels] = useState([]);
  
  // Assuming you have a way to get the token, for example, from context or local storage
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

  // Toggle modal visibility
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Export button click handler
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

    // Filter images by selected labels if any
    const filteredImages = project.images.filter((image) =>
      selectedLabels.length
        ? image.labels.some((label) => selectedLabels.includes(label._id))
        : true
    );

    // Label options for search
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={handleExport} // Call the export handler
            >
              Export
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Upload Data
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={toggleModal}
            >
              Edit
            </button>
          </div>
        </div>
        <p className="text-gray-600">{project.description}</p>

        {/* Columns selection */}
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

        {/* Search and Label Filter */}
        <div className="flex items-center gap-4">
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
        {/* Images Row */}
        <div
          className={`flex flex-wrap gap-4 justify-center items-center`}
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          {filteredImages.map((image) => (
            <div
              key={image._id}
              className={`w-1/${selectedColumns} bg-gray-200 rounded-lg overflow-hidden shadow`}
              style={{ flexBasis: `${100 / selectedColumns}%` }}
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
