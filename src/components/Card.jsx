import React from "react";
import { useQuery } from "react-query";
import { getProjects } from "../services/projectService";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import LazyImage from "./LazyImage";

// Helper function to extract initials from an email address.
const getInitials = (email) => {
  if (!email) return "";
  const namePart = email.split("@")[0];
  const parts = namePart.split(".");
  if (parts.length > 1) {
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  } else {
    return namePart.substring(0, 2).toUpperCase();
  }
};

const Card = () => {
  const token = useSelector((state) => state.account.token);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["Projects"],
    queryFn: async () => await getProjects(token),
    cacheTime: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-full w-full py-10">
        <p className="text-red-600 font-semibold">Error fetching projects:</p>
        <p className="text-sm text-gray-700 mt-2">
          {error?.message || "Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projects.data.map((project) => {
        // Determine the creation date.
        const createdDate = new Date(
          project.created_at?.$date || project.created_at
        );

        // Format the date as "3 February 2024"
        const formattedDate = createdDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Get the project owner from the members array.
        const owner =
          project.members && project.members.find((m) => m.role === "owner");

        return (
          <div key={project._id} className="flex justify-center">
            <Link to={`/project/${project._id}`} className="w-full">
              <div className="p-6 gap-1 h-full flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-lg bg-white rounded-lg shadow-md">
                <LazyImage
                  src={`${backendUrl}/${project.images[0]?.filePath}`}
                  alt={project.name}
                  width="100%"
                  height="200px"
                />
                <h2 className="font-bold text-lg md:text-xl mb-2">
                  {project.name}
                </h2>
                <p className="text-sm text-gray-600">{project.description}</p>
                <hr />
                {/* Render Labels */}
                {project.labels && project.labels.length > 0 && (
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500 mr-2">Labels:</span>
                    <div className="flex items-center space-x-2">
                      {project.labels.slice(0, 3).map((label) => (
                        <div
                          key={label._id}
                          className="flex items-center space-x-1"
                        >
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: label.color }}
                          ></span>
                          <span className="text-xs text-gray-500">
                            {label.name}
                          </span>
                        </div>
                      ))}
                      {project.labels.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{project.labels.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Render Owner */}
                {owner && (
                  <div className="flex items-center mt-2">
                    <div className="relative group">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {getInitials(owner.email)}
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        {owner.email}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Owner</span>
                  </div>
                )}
                <hr />
                <p className="text-xs text-gray-500 mt-2">
                  Created: {formattedDate}
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Card;
