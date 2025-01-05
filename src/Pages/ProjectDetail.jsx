// src/Pages/ProjectDetail.jsx

import React, { useState, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  getProjectsById,
  uploadImages,
  deleteProject,
  exportProject,
  getProjectImages,
  getProjectStatistics, // Import the new service function
} from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import { FiUpload, FiEdit, FiDownload, FiTrash, FiPlus } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import InviteModal from "../components/InviteModal";

Chart.register(ArcElement, Tooltip, Legend);

export default function ProjectDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Initialize queryClient
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("Filter"); // New state for menu

  const token = useSelector((state) => state.account.token);
  const currentUserEmail = useSelector((state) => state.account.email);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Fetch project details (name, description, labels)
  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorData,
  } = useQuery({
    queryKey: ["ProjectDetail", params.id],
    queryFn: async () => await getProjectsById(params.id, token),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    onError: (error) => {
      console.error("Error fetching project details:", error);
      toast.error("Failed to load project details.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  const members = projectData?.data?.data?.members || [];

  const isEditor = members.some(
    (m) => m.email === currentUserEmail && m.role === "editor"
  );

  // Extract Project ID from projectData
  const projectId = params.id || null;

  // Fetch Images using useInfiniteQuery
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
    queryFn: ({ pageParam = 0 }) =>
      getProjectImages(params.id, token, pageParam, 50),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextSkip : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    onError: (error) => {
      console.error("Error fetching project images:", error);
      toast.error("Failed to load project images.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  // Fetch Project Statistics using the new object-based useQuery
  const {
    data: statisticsData,
    isLoading: statisticsLoading,
    isError: statisticsError,
    error: statisticsErrorData,
  } = useQuery({
    queryKey: ["ProjectStatistics", projectId],
    queryFn: () => getProjectStatistics(projectId, token),
    enabled: !!projectId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    onError: (error) => {
      console.error("Error fetching project statistics:", error);
      toast.error("Failed to load project statistics.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  const handleExport = async () => {
    try {
      await exportProject(params.id, token);
      toast.success("Project exported successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export project data. Please try again.");
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) {
      toast.error("No files selected for upload");
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    setIsUploading(true);
    try {
      await uploadImages(params.id, formData, token);
      toast.success("Images uploaded successfully");
      // Invalidate and refetch the images query to include the new uploads
      queryClient.invalidateQueries(["ProjectImages", params.id]);
      queryClient.invalidateQueries(["ProjectStatistics", projectId]); // Update statistics
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload images. Please try again.");
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
        toast.success("Project removed successfully!");
        navigate("/");
      } catch (error) {
        console.error("Remove failed:", error);
        toast.error("Failed to remove project. Please try again.");
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

  // Prepare data for the Pie Chart
  const pieData = {
    labels: ["Labeled Images", "Unlabeled Images"],
    datasets: [
      {
        label: "# of Images",
        data: [
          statisticsData?.labeledImagesCount || 0,
          statisticsData?.unlabeledImagesCount || 0,
        ],
        backgroundColor: [
          "#4caf50", // Green for labeled
          "#f44336", // Red for unlabeled
        ],
        borderColor: [
          "#ffffff", // White border
          "#ffffff",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuration options for the Pie Chart
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

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
        <p className="text-sm text-gray-700 mt-2">
          {projectErrorData?.message || "Please try again."}
        </p>
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
  const allImages = imagesData?.pages?.flatMap((page) => page.images) || [];

  return (
    <div className="flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">{project.name}</h1>
          <div className="flex gap-3">
            {isEditor && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => setIsInviteModalOpen(true)}
              >
                <FiPlus />
                Invite
              </button>
            )}

            {isInviteModalOpen && isEditor && (
              <InviteModal
                projectId={projectId}
                onClose={() => setIsInviteModalOpen(false)}
              />
            )}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={handleExport}
              aria-label="Export Project"
            >
              <FiDownload />
              Export
            </button>
            {isEditor && (
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
            )}
            {isEditor && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleEdit}
                aria-label="Edit Project"
              >
                <FiEdit />
                Edit Project
              </button>
            )}
            {isEditor && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md hover:from-red-600 hover:to-orange-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleRemove}
                aria-label="Remove Project"
              >
                <FiTrash />
                Remove
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-600">{project.description}</p>

        {/* Images Grid */}
        <div
          className="grid gap-4 overflow-y-auto"
          style={{
            gridTemplateColumns: `repeat(${selectedColumns}, minmax(0, 1fr))`,
          }}
        >
          {allImages.map((image, index) => {
            const isLast = index === allImages.length - 1;
            const isLabeled = image.annotations && image.annotations.length > 0;

            return (
              <div
                key={image._id}
                className="bg-gray-100 rounded-lg shadow overflow-hidden relative flex items-center justify-center"
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
                        src={`${backendUrl}/${image.filePath}`}
                        alt={image.fileName}
                        className="absolute top-0 left-0 w-full h-full object-cover object-center"
                      />
                    </Link>
                    {/* Overlay SVG Icon with Hover Effect if Image is Labeled */}
                    {isLabeled && (
                      <div className="absolute bottom-1 right-1 bg-[#2196f3] p-1 rounded-full group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          role="img"
                          aria-label="Labeled Image"
                          className="h-4 w-4 text-white"
                        >
                          <path d="M19,6H22V8H19V11H17V8H14V6H17V3H19V6M17,17V14H19V19H3V6H11V8H5V17H17Z"></path>
                        </svg>
                        {/* Tooltip with Animation */}
                        <span className="absolute bottom-full right-1 mb-1 px-2 py-1 bg-[#2196f3] text-white text-xs rounded opacity-0 group-hover:opacity-100 transform translate-y-1 transition-opacity duration-200">
                          Labeled
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Multiple columns: keep a fixed height
                  <div className="relative w-full h-full">
                    <Link to={`/edit-image/${image._id}`}>
                      <img
                        src={`${backendUrl}/${image.filePath}`}
                        alt={image.fileName}
                        className={`w-full ${
                          selectedColumns === 5 ? "h-32" : "h-48"
                        } object-cover object-center`}
                      />
                    </Link>
                    {/* Overlay SVG Icon with Hover Effect if Image is Labeled */}
                    {isLabeled && (
                      <div className="absolute bottom-1 right-1 bg-[#2196f3] p-1 rounded-full group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          role="img"
                          aria-label="Labeled Image"
                          className="h-4 w-4 text-white"
                        >
                          <path d="M19,6H22V8H19V11H17V8H14V6H17V3H19V6M17,17V14H19V19H3V6H11V8H5V17H17Z"></path>
                        </svg>
                        {/* Tooltip with Animation */}
                        <span className="absolute bottom-full right-1 mb-1 px-2 py-1 bg-[#2196f3] text-white text-xs rounded opacity-0 group-hover:opacity-100 transform translate-y-1 transition-opacity duration-200">
                          Labeled
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading Indicator for Next Page */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <ClipLoader color="#000" size={30} />
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
            <p className="text-sm text-gray-700 mt-2">
              {imagesErrorData?.message || "Please try again."}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar on the right */}
      <aside className="w-64 bg-white shadow-md p-4 sticky top-4 h-fit overflow-y-auto">
        {/* Menu Buttons */}
        <div className="flex justify-around mb-6">
          <button
            className={`py-2 px-4 text-center ${
              activeMenu === "Filter"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
                : "border-b-2 border-transparent text-gray-600 hover:text-indigo-600"
            } transition-colors duration-200`}
            onClick={() => setActiveMenu("Filter")}
            aria-label="Filter Menu"
          >
            Filter
          </button>
          <button
            className={`py-2 px-4 text-center ${
              activeMenu === "Statistics"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
                : "border-b-2 border-transparent text-gray-600 hover:text-indigo-600"
            } transition-colors duration-200`}
            onClick={() => setActiveMenu("Statistics")}
            aria-label="Statistics Menu"
          >
            Statistics
          </button>
        </div>

        {/* Conditional Rendering Based on Active Menu */}
        {activeMenu === "Filter" ? (
          <>
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
                    aria-label={`Set columns to ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            {/* Additional Filter Options Can Be Added Here */}
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Statistics</h3>
              {statisticsLoading ? (
                <div className="flex justify-center items-center">
                  <ClipLoader color="#000" size={30} />
                </div>
              ) : statisticsError ? (
                <div className="text-red-600">
                  Error loading statistics:{" "}
                  {statisticsErrorData?.message || "Unknown error"}
                </div>
              ) : statisticsData ? (
                <div className="flex flex-col items-center">
                  {/* Total Images Display */}
                  <div className="mb-4 text-lg font-semibold">
                    Total Images: {statisticsData.totalImages}
                  </div>
                  {/* Pie Chart */}
                  <div className="w-48 h-48">
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">No statistics available.</div>
              )}
            </div>
          </>
        )}
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
