// src/components/Card.jsx

import React from "react";
import { useQuery } from "react-query";
import { getProjects } from "../services/projectService";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import LazyImage from "./LazyImage";

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
