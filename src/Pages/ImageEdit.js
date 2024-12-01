import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  ImageOverlay,
  FeatureGroup,
  Polygon,
  Rectangle,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useParams } from "react-router-dom";
import { getImageById, saveAnnotations } from "../services/imageService";
import { FiEye, FiTrash, FiBox } from "react-icons/fi";

export default function ImageEdit() {
  const { id } = useParams();
  const featureGroupRef = useRef(null);

  // State variables
  const [annotations, setAnnotations] = useState([]);
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  // Fetch image and annotations
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await getImageById(id);
        console.log("Fetched data:", response);

        // Parse annotations
        if (response?.annotations) {
          const parsedAnnotations = response.annotations.map((annotation) => ({
            ...annotation,
            bounds: annotation.bounds
              ? {
                  southWest: annotation.bounds.southWest,
                  northEast: annotation.bounds.northEast,
                }
              : undefined,
            coordinates: annotation.coordinates || [],
          }));
          console.log("Parsed annotations:", parsedAnnotations);
          setAnnotations(parsedAnnotations);
        }

        setImage(response);
      } catch (err) {
        console.error("Error fetching image:", err);
        setError(err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [id]);

  // Handle new shapes
  const handleCreated = (e) => {
    const { layerType, layer } = e;
    let newAnnotation;

    if (layerType === "polygon") {
      const coordinates = layer
        .getLatLngs()
        .map((latLngs) => latLngs.map(({ lat, lng }) => [lat, lng]));
      newAnnotation = { id: Date.now(), name: "Polygon", coordinates };
    } else if (layerType === "rectangle") {
      const bounds = layer.getBounds();
      const simplifiedBounds = {
        southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
        northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
      };
      newAnnotation = {
        id: Date.now(),
        name: "Rectangle",
        bounds: simplifiedBounds,
      };
    }

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);

    // Persist updated annotations to the backend
    saveAnnotations(id, updatedAnnotations)
      .then(() => console.log("Annotations saved successfully!"))
      .catch((err) => console.error("Error saving annotations:", err));
  };

  const handleEdited = (e) => {
    const { layers } = e; // Get the edited layers
    const updatedAnnotations = [...annotations];

    layers.eachLayer((layer) => {
      // Check if the layer is a Rectangle (bounds) or Polygon (coordinates)
      if (layer instanceof L.Rectangle) {
        const bounds = layer.getBounds();
        const updatedBounds = {
          southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        };

        // Find and update the corresponding annotation
        const annotationIndex = updatedAnnotations.findIndex(
          (annotation) =>
            annotation.bounds && // Ensure the annotation has bounds
            annotation.bounds.southWest[0] === bounds.getSouthWest().lat &&
            annotation.bounds.southWest[1] === bounds.getSouthWest().lng
        );

        if (annotationIndex !== -1) {
          updatedAnnotations[annotationIndex].bounds = updatedBounds;
        }
      } else if (layer instanceof L.Polygon) {
        const coordinates = layer
          .getLatLngs()
          .map((latLngs) => latLngs.map(({ lat, lng }) => [lat, lng]));

        // Find and update the corresponding annotation
        const annotationIndex = updatedAnnotations.findIndex(
          (annotation) =>
            annotation.coordinates &&
            JSON.stringify(annotation.coordinates) ===
              JSON.stringify(coordinates)
        );

        if (annotationIndex !== -1) {
          updatedAnnotations[annotationIndex].coordinates = coordinates;
        }
      }
    });

    // Update the annotations state
    setAnnotations(updatedAnnotations);

    // Save the updated annotations to the backend
    saveAnnotations(id, updatedAnnotations)
      .then(() => console.log("Edited annotations saved successfully!"))
      .catch((err) => console.error("Error saving edited annotations:", err));
  };

  // Remove annotations
  const removeAnnotation = (annotationId) => {
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation.id !== annotationId
    );
    setAnnotations(updatedAnnotations);

    // Persist updated annotations to the backend
    saveAnnotations(id, updatedAnnotations)
      .then(() => console.log("Annotations updated successfully!"))
      .catch((err) => console.error("Error updating annotations:", err));
  };

  if (isLoading) return <div>Loading image...</div>;
  if (isError)
    return <div>Error loading image: {error?.message || "Unknown error"}</div>;

  const bounds = [
    [0, 0],
    [500, 500],
  ];

  return (
    <div className="flex h-screen">
      {/* Annotations Panel */}
      <div className="w-72 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
          Annotations ({annotations.length})
          <button className="text-blue-500 hover:text-blue-700 flex items-center space-x-1">
            <FiBox />
            <span>Add</span>
          </button>
        </h3>
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
                <button className="text-gray-500 hover:text-gray-700">
                  <FiEye />
                </button>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeAnnotation(annotation.id)}
                >
                  <FiTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Container */}
      <MapContainer
        style={{ height: "100%", flex: 1 }}
        center={[250, 250]}
        zoom={1}
        crs={L.CRS.Simple}
      >
        {image && (
          <ImageOverlay
            url={`http://localhost:3001/${image.filePath}`}
            bounds={bounds}
          />
        )}
        <FeatureGroup ref={featureGroupRef}>
          {annotations.map((annotation) => {
            if (annotation.coordinates && annotation.coordinates.length > 0) {
              // Render Polygon if coordinates exist
              return (
                <Polygon
                  key={annotation.id}
                  positions={annotation.coordinates}
                />
              );
            } else if (annotation.bounds) {
              // Render Rectangle if bounds exist
              return (
                <Rectangle
                  key={annotation.id}
                  bounds={[
                    annotation.bounds.southWest,
                    annotation.bounds.northEast,
                  ]}
                />
              );
            }
            return null;
          })}
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            draw={{
              rectangle: true,
              circle: false,
              marker: false,
              polygon: true,
              circlemarker: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
