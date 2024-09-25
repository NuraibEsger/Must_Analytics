import React from "react";
import { getProjectsById } from "../services/projectService";
import { useParams } from "react-router-dom";
import ErrorBlock from "../components/ErrorBlock";
import { useQuery } from "@tanstack/react-query";

export default function ProjectDetail() {
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["Projects", params.id],
    queryFn: () => getProjectsById(params.id), // Pass the project ID directly
  });

  let content;

  if (isPending) {
    content = (
      <div className="flex justify-center">
        <p>Fetching project data...</p>
      </div>
    );
  }

  if (isError) {
    content = (
      <div className="center">
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
    const project = data.data; // Assuming the API returns { data: project }

    content = (
      <div>
        <h1>{project.name}</h1>
        <p>{project.description}</p>

        {project.images && project.images.length > 0 && (
          <div>
            <h3>Images:</h3>
            {project.images.map((image) => (
              <img key={image._id} src={image.filePath} alt={image.fileName} />
            ))}
          </div>
        )}
        {project.labels && project.labels.length > 0 && (
          <div>
            <h3>Labels:</h3>
            {project.labels.map((label) => (
              <span
                key={label._id}
                style={{
                  backgroundColor: label.color,
                  padding: "4px",
                  color: "#fff",
                  marginRight: "5px",
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div>{content}</div>;
}
