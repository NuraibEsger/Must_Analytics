import React, { useState, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import {
  getProjectsById,
  uploadImages,
  deleteProject,
  exportProject,
  getProjectImages,
  getProjectStatistics,
  deleteImage,
} from "../services/projectService";
import ErrorBlock from "../components/ErrorBlock";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/ConfirmationModal"; // Import the ConfirmationModal
import {
  FiUpload,
  FiEdit,
  FiDownload,
  FiTrash,
  FiPlus,
  FiEye,
  FiTrash2,
} from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

import { Pie, Bar } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import InviteModal from "../components/InviteModal";

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function ProjectDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedColumns, setSelectedColumns] = useState(4);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("Filter");

  const token = useSelector((state) => state.account.token);
  const currentUserEmail = useSelector((state) => state.account.email);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // State for Confirmation Modals
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [isDeleteImageModalOpen, setIsDeleteImageModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null); // To track which image to delete

  // Fetch project details
  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorData,
  } = useQuery({
    queryKey: ["ProjectDetail", params.id],
    queryFn: () => getProjectsById(params.id, token),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    onError: (error) => {
      console.error("Error fetching project details:", error);
      toast.error("Failed to load project details.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  const project = projectData;

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
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    onError: (error) => {
      console.error("Error fetching project images:", error);
      toast.error("Failed to load project images.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  // Fetch Project Statistics
  const {
    data: statisticsData,
    isLoading: statisticsLoading,
    isError: statisticsError,
    error: statisticsErrorData,
  } = useQuery({
    queryKey: ["ProjectStatistics", projectId],
    queryFn: () => getProjectStatistics(projectId, token),
    enabled: !!projectId && !!token,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    onError: (error) => {
      console.error("Error fetching project statistics:", error);
      toast.error("Failed to load project statistics.", {
        position: "top-right",
        autoClose: 5000,
      });
    },
  });

  // Handle Export
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

  // Handle File Upload
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

  // Handle Edit
  const handleEdit = () => {
    if (project) {
      setInitialData(project);
      setIsModalOpen(true);
    }
  };

  // Handle Remove Project
  const handleRemove = async () => {
    // Instead of window.confirm, open the ConfirmationModal
    setIsDeleteProjectModalOpen(true);
  };

  // Confirm Remove Project
  const confirmRemoveProject = async () => {
    try {
      await deleteProject(params.id, token);
      toast.success("Project removed successfully!");
      navigate("/");
    } catch (error) {
      console.error("Remove failed:", error);
      toast.error("Failed to remove project. Please try again.");
    } finally {
      setIsDeleteProjectModalOpen(false);
    }
  };

  // Handle Delete Image
  const handleDeleteImage = (imageId) => {
    // Instead of window.confirm, open the ConfirmationModal
    setImageToDelete(imageId);
    setIsDeleteImageModalOpen(true);
  };

  // Confirm Delete Image
  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await deleteImage(projectId, imageToDelete, token);
      toast.success("Image deleted successfully!");
      // Invalidate and refetch the images query to reflect the deletion
      queryClient.invalidateQueries(["ProjectImages", projectId]);
      queryClient.invalidateQueries(["ProjectStatistics", projectId]); // Update statistics if needed
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image. Please try again.");
    } finally {
      setIsDeleteImageModalOpen(false);
      setImageToDelete(null);
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

  // Flatten images from all pages, maintaining the order (newest first)
  const allImages = imagesData?.pages?.flatMap((page) => page.images) || [];

  // Compute label usage counts
  const labelUsageCounts = useMemo(() => {
    const counts = {};

    // Initialize counts with label names
    project?.data?.labels?.forEach((label) => {
      counts[label._id] = { _id: label._id, name: label.name, color: label.color, count: 0 };
    });

    // Iterate through all images and their annotations to tally counts
    allImages.forEach((image) => {
      image.annotations.forEach((annotation) => {
        if (annotation.label) {
          const labelId = annotation.label._id || annotation.label; // Depending on how it's populated
          if (counts[labelId]) {
            counts[labelId].count += 1;
          }
        }
      });
    });

    return counts;
  }, [allImages, project?.data?.labels]);

  // Prepare data for the Pie Chart
  const pieData = useMemo(
    () => ({
      labels: ["Labeled Images", "Unlabeled Images"],
      datasets: [
        {
          label: "# of Images",
          data: [
            statisticsData?.labeledImagesCount || 0,
            statisticsData?.unlabeledImagesCount || 0,
          ],
          backgroundColor: ["#4caf50", "#f44336"],
          borderColor: ["#ffffff", "#ffffff"],
          borderWidth: 1,
        },
      ],
    }),
    [statisticsData]
  );

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

  // Prepare data for the Bar Chart
  const barData = useMemo(() => {
    const labels = Object.values(labelUsageCounts).map((label) => label.name);
    const data = Object.values(labelUsageCounts).map((label) => label.count);
    const backgroundColors = Object.values(labelUsageCounts).map((label) => label.color);

    return {
      labels,
      datasets: [
        {
          label: "Label Usage",
          data,
          backgroundColor: backgroundColors,
        },
      ],
    };
  }, [labelUsageCounts]);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
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

  if (!project) {
    return (
      <div className="py-10">
        <ErrorBlock
          title="No Data"
          message="No project data found. Please try again later."
        />
      </div>
    );
  }

  const currentUserMember = project.data.members?.find(
    (member) => member.email === currentUserEmail
  );

  const currentUserRole = currentUserMember ? currentUserMember.role : "visitor";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header or Top Bar can be added here if needed */}

      <div className="flex flex-1 gap-4 container mx-auto absolute left-52 p-4">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-1">
              {project.data.name}
            </h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            {project.data.description}
          </p>

          {/* Buttons Section */}
          <div className="flex justify-start items-center sticky top-0 bg-white z-10 py-2">
            <div className="flex gap-3">
              {/* Invite Button: Only visible to Owners */}
              {currentUserRole === "owner" && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={() => setIsInviteModalOpen(true)}
                  aria-label="Invite Members"
                >
                  <FiPlus />
                  Invite
                </button>
              )}

              {/* Render InviteModal only if open and user is owner */}
              {currentUserRole === "owner" && isInviteModalOpen && (
                <InviteModal
                  projectId={projectId}
                  onClose={() => setIsInviteModalOpen(false)}
                />
              )}

              {/* Export Button: Visible to all roles */}
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleExport}
                aria-label="Export Project"
              >
                <FiDownload />
                Export
              </button>

              {/* Upload Data Button: Only visible to Owner and Editor */}
              {(currentUserRole === "owner" ||
                currentUserRole === "editor") && (
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

              {/* Edit Project Button: Only visible to Owner and Editor */}
              {(currentUserRole === "owner" ||
                currentUserRole === "editor") && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={handleEdit}
                  aria-label="Edit Project"
                >
                  <FiEdit />
                  Edit Project
                </button>
              )}

              {/* Remove Project Button: Only visible to Owners */}
              {currentUserRole === "owner" && (
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

          {/* Images Grid */}
          <div
            className="grid gap-4 overflow-y-auto"
            style={{
              gridTemplateColumns: `repeat(${selectedColumns}, minmax(0, 1fr))`,
            }}
          >
            {allImages.map((image, index) => {
              const isLast = index === allImages.length - 1;
              const isLabeled =
                image.annotations && image.annotations.length > 0;

              return (
                <div
                  key={image._id}
                  className="bg-gray-100 rounded-lg shadow overflow-hidden h-max relative group"
                  ref={isLast ? lastImageRef : null}
                >
                  {/* Conditional Container Styling */}
                  <div
                    className={`relative w-full flex items-center ${
                      selectedColumns === 1 ? "aspect-auto" : "aspect-square"
                    }`}
                  >
                    <Link to={`/edit-image/${image._id}`}>
                      <img
                        src={`${backendUrl}/${image.filePath}`}
                        alt={image.fileName}
                        className="object-cover object-center w-full h-full"
                      />
                    </Link>

                    {/* Overlay if Image is Labeled */}
                    {isLabeled && (
                      <div className="absolute bottom-1 right-1 bg-[#2196f3] p-1 rounded-full flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          role="img"
                          aria-label="Labeled Image"
                          className="h-4 w-4 text-white"
                        >
                          <path d="M19,6H22V8H19V11H17V8H14V6H17V3H19V6M17,17V14H19V19H3V6H11V8H5V17H17Z"></path>
                        </svg>
                        {/* Always Visible Tooltip */}
                        <span className="ml-1 px-2 py-0.5 bg-[#2196f3] text-white text-xs rounded">
                          Labeled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                    <button
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      onClick={() => handleDeleteImage(image._id)}
                      aria-label="Delete Image"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                    <Link
                      to={`/edit-image/${image._id}`}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      aria-label="See Image"
                    >
                      <FiEye />
                      See
                    </Link>
                  </div>
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
              <p className="text-red-600 font-semibold">
                Error loading images:
              </p>
              <p className="text-sm text-gray-700 mt-2">
                {imagesErrorData?.message || "Please try again."}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar on the right */}
        <aside className="w-80 bg-white shadow-md p-4 sticky top-0 h-screen overflow-y-auto rounded-lg">
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
                    <div className="w-48 h-48 mb-6">
                      <Pie data={pieData} options={pieOptions} />
                    </div>
                    {/* Bar Chart for Label Usage (Optional) */}
                    <div className="w-full h-32 mb-6">
                      <Bar data={barData} options={barOptions} />
                    </div>
                    {/* Label Usage Counts */}
                    <div className="w-full">
                      <h4 className="text-md font-semibold mb-2">
                        Label Usage
                      </h4>
                      <ul>
                        {Object.values(labelUsageCounts).map((label) => (
                          <li
                            key={label._id}
                            className="flex items-center mb-1"
                          >
                            <span
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: label.color }}
                            ></span>
                            <span className="text-gray-700">
                              {label.name} - {label.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">No statistics available.</div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Edit Project Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          toggleModal={() => setIsModalOpen(false)}
          initialData={initialData}
        />
      )}

      {/* Confirmation Modal for Deleting Project */}
      <ConfirmationModal
        isOpen={isDeleteProjectModalOpen}
        title="Delete Project"
        message="This action will permanently remove the project and all its data. Do you want to proceed?"
        onConfirm={confirmRemoveProject}
        onCancel={() => setIsDeleteProjectModalOpen(false)}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
      />

      {/* Confirmation Modal for Deleting Image */}
      <ConfirmationModal
        isOpen={isDeleteImageModalOpen}
        title="Delete Image"
        message="This action will permanently remove the selected image. Do you want to proceed?"
        onConfirm={confirmDeleteImage}
        onCancel={() => setIsDeleteImageModalOpen(false)}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
      />
    </div>
  );
}
