import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getProjectsById, uploadImages, deleteProject } from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import { exportProject } from "../services/projectService";
import { FiUpload, FiEdit, FiDownload, FiTrash } from "react-icons/fi";

export default function ProjectDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null); // Pass data for editing

  const token = useSelector((state) => state.account.token);

  // Fetch the project by ID
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["Projects", params.id],
    queryFn: () => getProjectsById(params.id, token),
  });

  const handleExport = async () => {
    try {
      await exportProject(params.id, token);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export project data. Please try again.");
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) {
      alert("No files selected for upload");
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    setIsUploading(true);
    try {
      await uploadImages(params.id, formData, token);
      alert("Images uploaded successfully");
      refetch();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    if (data) {
      setInitialData(data.data); // Set the project data to pass to the modal
      setIsModalOpen(true);
    }
  };

  const handleRemove = async () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(params.id, token);
        alert("Project removed successfully!");
        navigate("/");
      } catch (error) {
        console.error("Remove failed:", error);
        alert("Failed to remove project. Please try again.");
      }
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
            <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition cursor-pointer">
              <FiUpload />
              {isUploading ? "Uploading..." : "Upload Data"}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={handleEdit}
            >
              <FiEdit />
              Edit Project
            </button>
            <button
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
              onClick={handleRemove}
            >
              <FiTrash />
              Remove
            </button>
          </div>
        </div>
        <p className="text-gray-600">{project.description}</p>

        {/* Columns Selector */}
        <div className="flex items-center gap-4 mb-4">
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

        {/* Images Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${selectedColumns}, minmax(0, 1fr))`,
          }}
        >
          {project.images.map((image) => (
            <div
              key={image._id}
              className="bg-gray-100 rounded-lg shadow overflow-hidden"
            >
              <Link to={`/edit-image/${image._id}`}>
                <img
                  src={`http://localhost:3001/${image.filePath}`}
                  alt={image.fileName}
                  className="w-full h-48 object-cover"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {content}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          toggleModal={() => setIsModalOpen(false)}
          initialData={initialData} // Pass project data for editing
        />
      )}
    </div>
  );
}
