// src/Pages/ProjectDetail.jsx

import React, { useState, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getProjectsById, uploadImages, deleteProject, exportProject, getProjectImages } from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import { FiUpload, FiEdit, FiDownload, FiTrash } from "react-icons/fi";

export default function ProjectDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Initialize queryClient
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const token = useSelector((state) => state.account.token);

  // Fetch project details (name, description, labels)
  const { data: projectData, isLoading: projectLoading, isError: projectError, error: projectErrorData } = useQuery({
    queryKey: ["ProjectDetail", params.id],
    queryFn: () => getProjectsById(params.id, token),
  });

  // Infinite Query for images
  const {
    data: imagesData,
    isLoading: imagesLoading,
    isError: imagesError,
    error: imagesErrorData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["ProjectImages", params.id],
    queryFn: ({ pageParam = 0 }) => getProjectImages(params.id, token, pageParam, 50),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextSkip : undefined),
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
      // Invalidate and refetch the images query to include the new uploads
      queryClient.invalidateQueries(["ProjectImages", params.id]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    if (projectData) {
      setInitialData(projectData.data);
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

  // Infinite Scroll Trigger: Observe a sentinel at the bottom
  const observerRef = useRef();
  const lastImageRef = useCallback(
    (node) => {
      if (imagesLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [imagesLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex flex-col justify-center items-center h-full w-full py-10">
        <p className="text-red-600 font-semibold">Error fetching project:</p>
        <p className="text-sm text-gray-700 mt-2">{projectErrorData?.message || "Please try again."}</p>
      </div>
    );
  }

  if (!projectData || !projectData.data) {
    return (
      <div className="py-10">
        <ErrorBlock
          title="No Data"
          message="No project data found. Please try again later."
        />
      </div>
    );
  }

  const project = projectData.data;

  // Flatten images from all pages, maintaining the order (newest first)
  const allImages = imagesData?.pages?.flatMap(page => page.images) || [];

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
          {allImages.map((image, index) => {
            const isLast = index === allImages.length - 1;
            return (
              <div
                key={image._id}
                className="bg-gray-100 rounded-lg shadow overflow-hidden flex items-center justify-center"
                ref={isLast ? lastImageRef : null}
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
                      className={`w-full ${
                        selectedColumns === 5 ? "h-32" : "h-48"
                      } object-cover object-center`}
                    />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading Indicator for Next Page */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Handle No More Images */}
        {!hasNextPage && !imagesLoading && (
          <div className="flex justify-center py-4">
            <p className="text-gray-500">No more images to load.</p>
          </div>
        )}

        {/* Handle Error While Loading Images */}
        {imagesError && (
          <div className="flex flex-col justify-center items-center py-4">
            <p className="text-red-600 font-semibold">Error loading images:</p>
            <p className="text-sm text-gray-700 mt-2">{imagesErrorData?.message || "Please try again."}</p>
          </div>
        )}
      </div>

      {/* Sidebar on the right */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">Filter</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Columns</h3>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((num) => (
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
