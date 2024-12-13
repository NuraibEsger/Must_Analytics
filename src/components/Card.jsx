// src/components/Card.jsx

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../services/projectService";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import LazyImage from "./LazyImage";

const Card = () => {
  const token = useSelector((state) => state.account.token);
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
        <p className="text-sm text-gray-700 mt-2">{error?.message || "Please try again."}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6">
      {projects.data.map((project) => (
        <div key={project._id} className="flex justify-center">
          <Link to={`/project/${project._id}`} className="w-full">
            <div className="p-6 h-full flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-lg bg-white rounded-lg shadow-md">
              <LazyImage
                src={`http://localhost:3001/${project.images[0]?.filePath}`}
                alt={project.name}
                width="100%"
                height="200px"
              />
              <h2 className="font-bold text-lg md:text-xl mb-2">{project.name}</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Card;
