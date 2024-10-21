import React, { useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Line as KonvaLine,
} from "react-konva";
import useImage from "use-image";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getImageById, saveAnnotations } from "../services/imageService";
import {
  FiEye,
  FiTrash,
  FiBox,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ImageEdit() {
  const { id } = useParams();
  const [annotations, setAnnotations] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [image, setImage] = useState(null);
  const [newShape, setNewShape] = useState(null);

  // Fetch image and annotations from the backend
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["Images", id],
    queryFn: () => getImageById(id),
    onSuccess: (data) => {
      console.log('Fetched data onSuccess:', data);
      setAnnotations(data?.data?.annotations || []);
      setImage(data?.data?.filePath);
      setIsDataLoaded(true);
    },
  });
  
  // Debugging Loading and Error states
  

  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations),
    onSuccess: (data) => {
      console.log("Annotations saved successfully!", data);
    },
    onError: () => {
      toast.error("Error saving annotations.");
    },
  });

  // Load the image from the server
  const [img, imgStatus] = useImage(
    image ? `http://localhost:3001/${image}` : null,
    "Anonymous"
  );

  useEffect(() => {
    if (imgStatus === "loaded") {
      console.log("Image loaded successfully:", image);
    } else if (imgStatus === "failed") {
      console.error("Image failed to load. Please check the URL:", image);
    }
  }, [imgStatus, image]);

  if (isLoading) {
    console.log('Loading image...');
  }
  
  if (isError) {
    console.error('Error fetching image:', error);
    return <div>Error loading image.</div>;
  }

  // Handle new shape creation (polygon or rectangle)
  const handleShapeCreation = (shapeType, pointsOrBounds) => {
    const newAnnotation = {
      id: Date.now(),
      name:
        shapeType === "polygon"
          ? `Polygon ${annotations.length + 1}`
          : `Rectangle`,
      coordinates: shapeType === "polygon" ? pointsOrBounds : undefined,
      bounds: shapeType === "rectangle" ? pointsOrBounds : undefined,
    };
    const updatedAnnotations = [newAnnotation, ...annotations];
    setAnnotations(updatedAnnotations);
    mutation.mutate(updatedAnnotations);
  };

  const handlePolygonCreation = (points) => {
    handleShapeCreation("polygon", points);
  };

  const handleRectangleCreation = (bounds) => {
    handleShapeCreation("rectangle", bounds);
  };

  // Handle annotation deletion
  const removeAnnotation = (id) => {
    if (window.confirm("Are you sure you want to delete this annotation?")) {
      const updatedAnnotations = annotations.filter(
        (annotation) => annotation.id !== id
      );
      setAnnotations(updatedAnnotations);
      mutation.mutate(updatedAnnotations);
    }
  };

  if (isLoading) {
    return <div>Loading image...</div>;
  }

  if (isError) {
    return (
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    );
  }

  return (
    <div className="flex h-screen w-screen relative">
      {/* Annotations Panel */}
      <div
        className={`absolute top-0 left-0 h-full bg-white shadow-lg p-4 overflow-y-auto transition-transform duration-300 ${
          isSidebarOpen ? "w-80" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          {isSidebarOpen && (
            <h3 className="text-lg font-semibold">
              Annotations ({annotations.length})
            </h3>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>
        {isSidebarOpen && (
          <>
            <button
              className="flex items-center mb-4 bg-blue-500 text-white px-3 py-2 rounded"
              onClick={() => {
                /* Add annotation logic */
              }}
            >
              <FiPlus className="mr-2" /> Add Annotation
            </button>
            <ul className="space-y-2">
              {annotations.map((annotation) => (
                <li
                  key={annotation.id}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <FiBox />
                    <span>{annotation.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500">
                      <FiEye />
                    </button>
                    <button
                      className="text-red-500"
                      onClick={() => removeAnnotation(annotation.id)}
                    >
                      <FiTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Image Canvas */}
      <Stage width={window.innerWidth} height={window.innerHeight - 100}>
        <Layer>
          {/* Display image */}
          {img && imgStatus === "loaded" && (
            <KonvaImage image={img} width={img.width} height={img.height} />
          )}

          {/* Render saved annotations */}
          {annotations.map((annotation) => {
            if (annotation.coordinates) {
              return (
                <KonvaLine
                  key={annotation.id}
                  points={annotation.coordinates.flat()}
                  fill="rgba(0, 0, 255, 0.3)"
                  stroke="blue"
                  closed
                />
              );
            } else if (annotation.bounds) {
              const [x1, y1] = annotation.bounds[0];
              const [x2, y2] = annotation.bounds[1];
              return (
                <Rect
                  key={annotation.id}
                  x={x1}
                  y={y1}
                  width={x2 - x1}
                  height={y2 - y1}
                  fill="rgba(255, 0, 0, 0.3)"
                  stroke="red"
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
