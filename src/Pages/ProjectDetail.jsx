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
  const [initialData, setInitialData] = useState(null);

  const token = useSelector((state) => state.account.token);

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
      setInitialData(data.data);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <p className="text-lg text-gray-700">Loading project data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10">
        <ErrorBlock
          title="Failed to load project"
          message={
            error?.info?.message ||
            "Failed to fetch project data, please try again later"
          }
        />
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className="py-10">
        <ErrorBlock
          title="No Data"
          message="No project data found. Please try again later."
        />
      </div>
    );
  }

  const project = data.data;

  return (
    <div className="flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">{project.name}</h1>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={handleExport}
            >
              <FiDownload />
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
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
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={handleEdit}
            >
              <FiEdit />
              Edit Project
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md hover:from-red-600 hover:to-orange-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={handleRemove}
            >
              <FiTrash />
              Remove
            </button>
          </div>
        </div>
        <p className="text-gray-600">{project.description}</p>

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
              className="bg-gray-100 rounded-lg shadow overflow-hidden flex items-center justify-center"
            >
              {/* If single column, use a square ratio container to create a square image */}
              {selectedColumns === 1 ? (
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "100%" }}
                >
                  <Link to={`/edit-image/${image._id}`}>
                    <img
                      src={`http://localhost:3001/${image.filePath}`}
                      alt={image.fileName}
                      className="absolute top-0 left-0 w-full h-full object-cover object-center"
                    />
                  </Link>
                </div>
              ) : (
                // Multiple columns: keep a fixed height
                <Link to={`/edit-image/${image._id}`}>
                  <img
                    src={`http://localhost:3001/${image.filePath}`}
                    alt={image.fileName}
                    className="w-full h-48 object-cover object-center"
                  />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar on the right */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">Filter</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Columns</h3>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((num) => (
              <button
              key={num}
              className={`px-5 py-1 rounded-full transition-all duration-200 
                ${
                  selectedColumns === num
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              onClick={() => setSelectedColumns(num)}
            >
              {num}
            </button>
            ))}
          </div>
        </div>
      </aside>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          toggleModal={() => setIsModalOpen(false)}
          initialData={initialData}
        />
      )}
    </div>
  );
}
