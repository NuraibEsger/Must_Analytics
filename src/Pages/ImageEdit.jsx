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
import { FiEye, FiTrash, FiBox, FiEyeOff } from "react-icons/fi";
import { getLabels } from "../services/labelService";
import { useSelector } from "react-redux";

export default function ImageEdit() {
  const { id } = useParams();
  const featureGroupRef = useRef(null);

  // State variables
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [labels, setLabels] = useState([]);
  
  const token = useSelector((state) => state.account.token);
  // Fetch image, annotations, and labels
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

    // Fetch project labels (assuming you have a service to get labels)
    const fetchLabels = async () => {
      try {
        const response = await getLabels(token); // Replace with your label fetching logic
        setLabels(response.data);
      } catch (err) {
        console.error("Error fetching labels:", err);
      }
    };

    fetchImage();
    fetchLabels();
  }, [id, token]);

  // Handle new shapes
  const handleCreated = (e) => {
    const { layerType, layer } = e;
    let newAnnotation;

    if (layerType === "polygon") {
      const coordinates = layer
        .getLatLngs()
        .map((latLngs) => latLngs.map(({ lat, lng }) => [lat, lng]));
      newAnnotation = { id: Date.now(), name: "Polygon", coordinates, label: null };
    } else if (layerType === "rectangle") {
      const bounds = layer.getBounds();
      const simplifiedBounds = {
        southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
        northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
      };
      newAnnotation = { id: Date.now(), name: "Rectangle", bounds: simplifiedBounds, label: null };
    }

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);

    // Persist updated annotations to the backend
    saveAnnotations(id, updatedAnnotations)
      .then(() => console.log("Annotations saved successfully!"))
      .catch((err) => console.error("Error saving annotations:", err));
  };

  const handleLabelChange = (annotationId, labelId) => {
    const updatedAnnotations = annotations.map((annotation) => {
      if (annotation.id === annotationId) {
        return { ...annotation, label: labelId };
      }
      return annotation;
    });
    setAnnotations(updatedAnnotations);
  
    // Persist updated annotations to the backend
    saveAnnotations(id, updatedAnnotations)
      .then(() => console.log("Annotation label updated successfully!"))
      .catch((err) => console.error("Error updating annotation label:", err));
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
          (annotation) => annotation.bounds && annotation.id === layer.options.id
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
          (annotation) => annotation.coordinates && annotation.id === layer.options.id
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

  // Toggle annotation visibility
  const toggleVisibility = (annotationId) => {
    setHiddenAnnotations((prev) =>
      prev.includes(annotationId)
        ? prev.filter((id) => id !== annotationId)
        : [...prev, annotationId]
    );
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
                <select
                  value={annotation.label || ""} // Set initial value to the current label
                  onChange={(e) =>
                    handleLabelChange(annotation.id, e.target.value)
                  }
                >
                  <option value="">{annotation.label?.name || "Select Label"}</option>
                  {labels.map((label) => (
                    <option key={label._id} value={label._id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => toggleVisibility(annotation.id)}
                >
                  {hiddenAnnotations.includes(annotation.id) ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
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
            if (hiddenAnnotations.includes(annotation.id)) return null;
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
              polyline: false,
            }}
            edit={{
              edit: true,
              remove: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
