import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  ImageOverlay,
  FeatureGroup,
  Polygon,
  Rectangle,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useParams } from "react-router-dom";
import { getImageById, saveAnnotations } from "../services/imageService";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { FiEye, FiTrash, FiBox, FiEyeOff, FiPlus } from "react-icons/fi";
import { useSelector } from "react-redux";
import AddLabelModal from "../components/AddLabelModal";

// Helper component to fit map bounds
function FitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);

  return null;
}

export default function ImageEdit() {
  const { id } = useParams();
  const featureGroupRef = useRef(null);
  const mapRef = useRef(null); // Reference to the map instance

  // State variables
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [image, setImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null); // Image natural dimensions
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [labels, setLabels] = useState([]);
  const [isAddLabelModalOpen, setIsAddLabelModalOpen] = useState(false);

  const token = useSelector((state) => state.account.token);
  const currentUserEmail = useSelector((state) => state.account.email);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // User's role
  const [isEditor, setIsEditor] = useState(false);

  const [projectId, setProjectId] = useState(null); // Project ID

  // Fixed MapContainer dimensions
  const mapWidth = 848;
  const mapHeight = 858;

  // Fetch image, annotations, and labels
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await getImageById(id, token);
        // Expected response: { image: {...}, labels: [...], projectId: "...", members: [...] }
        if (response.image) {
          setImage(response.image);
          setAnnotations(response.image.annotations || []);
          setLabels(response.labels || []);

          // Load the image to get its natural dimensions
          const img = new Image();
          img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
          };
          img.onerror = (err) => {
            console.error("Error loading image for dimensions:", err);
            setError(err);
            setIsError(true);
          };
          img.src = `${backendUrl}/${response.image.filePath}`;
        }
        if (response.projectId) {
          setProjectId(response.projectId);
          const members = response.members;
          console.log(members);
          // Find user’s membership
          const foundMember = members.find(
            (m) => m.email === currentUserEmail
          );
          if (foundMember?.role === "editor") {
            setIsEditor(true);
          }
        }
      } catch (err) {
        console.error("Error fetching image:", err);
        setError(err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImage();
  }, [id, token, currentUserEmail, backendUrl]);

  const toggleAddLabelModal = () => {
    setIsAddLabelModalOpen(!isAddLabelModalOpen);
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);
      await saveAnnotations(id, annotations, token);
      toast.info("Annotations saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (err) {
      console.error("Error saving annotations:", err);
      toast.error("Failed to save annotations.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle new shapes
  const handleCreated = (e) => {
    // If isEditor is false, do not let them create shapes
    if (!isEditor) return;
    const { layerType, layer } = e;
    let newAnnotation;

    if (layerType === "polygon") {
      const coordinates = layer
        .getLatLngs()
        .map((latLngs) => latLngs.map(({ lat, lng }) => [lat, lng]));
      newAnnotation = {
        id: Date.now(),
        name: "Polygon",
        coordinates,
        label: null,
      };
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
        label: null,
      };
    }

    setAnnotations((prevAnnotations) => [...prevAnnotations, newAnnotation]);
  };

  // Handle label changes
  const handleLabelChange = async (annotationId, labelId) => {
    // If not editor, do nothing
    if (!isEditor) return;

    const selectedLabel = labels.find((label) => label._id === labelId);

    // Optimistic update
    setAnnotations((prevAnnotations) =>
      prevAnnotations.map((annotation) =>
        annotation.id === annotationId
          ? { ...annotation, label: selectedLabel }
          : annotation
      )
    );

    try {
      await saveAnnotations(
        id,
        annotations.map((annotation) =>
          annotation.id === annotationId
            ? { ...annotation, label: selectedLabel }
            : annotation
        ),
        token
      );
    } catch (error) {
      console.error("Error updating annotations:", error);
      toast.error("Failed to save changes.");
    }
  };

  // Remove annotations
  const removeAnnotation = (annotationId) => {
    if (!isEditor) return;
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation.id !== annotationId
    );
    setAnnotations(updatedAnnotations);

    // Persist updated annotations to the backend
    saveAnnotations(id, updatedAnnotations, token).catch((err) =>
      console.error("Error updating annotations:", err)
    );
  };

  // Toggle annotation visibility
  const toggleVisibility = (annotationId) => {
    setHiddenAnnotations((prev) =>
      prev.includes(annotationId)
        ? prev.filter((id) => id !== annotationId)
        : [...prev, annotationId]
    );
  };

  // Calculate scaled image dimensions based on MapContainer size
  const scaledDimensions = useMemo(() => {
    if (!imageDimensions) return null;

    const { width, height } = imageDimensions;
    const containerWidth = mapWidth;
    const containerHeight = mapHeight;

    let scale = 1;

    if (width > containerWidth || height > containerHeight) {
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      scale = Math.min(scaleX, scaleY);
    }

    return {
      width: width * scale,
      height: height * scale,
    };
  }, [imageDimensions, mapWidth, mapHeight]);

  // Define bounds based on scaled dimensions
  const bounds = useMemo(() => {
    if (!scaledDimensions) return null;
    return [
      [0, 0], // Bottom-left corner
      [scaledDimensions.height, scaledDimensions.width], // Top-right corner
    ];
  }, [scaledDimensions]);

  // Center the map based on scaled dimensions
  const center = useMemo(() => {
    if (!scaledDimensions) return [0, 0];
    return [
      scaledDimensions.height / 2,
      scaledDimensions.width / 2,
    ];
  }, [scaledDimensions]);

  if (isLoading || !imageDimensions) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <ClipLoader color="#000" size={50} />
        <span className="ml-2">Loading image...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        Error loading image: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Annotations Panel */}
      <div className="w-96 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
          Annotations ({annotations.length})
          {isEditor && (
            <button
              className="text-blue-500 hover:text-blue-700 flex items-center space-x-1"
              onClick={handleSaveClick}
              disabled={isSaving}
              aria-label="Save Annotations"
            >
              <FiBox />
              <span>Save</span>
            </button>
          )}
          {isEditor && (
            <button
              className="text-green-500 hover:text-green-700 flex items-center space-x-1"
              onClick={toggleAddLabelModal}
              aria-label="Add Label"
            >
              <FiPlus />
              <span>Add Label</span>
            </button>
          )}
        </h3>

        {/* Loading indicator */}
        {isSaving && (
          <div className="flex justify-center items-center mt-2">
            <ClipLoader color="#000" size={20} />
          </div>
        )}

        <ul className="space-y-2">
          {annotations.map((annotation) => (
            <li
              key={annotation.id}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <FiBox />
                {/* If not editor, disable the dropdown */}
                <select
                  disabled={!isEditor} // disable if not editor
                  value={annotation.label?._id || ""} // store the label _id
                  onChange={(e) =>
                    handleLabelChange(annotation.id, e.target.value)
                  }
                  className={`border border-gray-300 rounded-md px-2 py-1 ${
                    !isEditor ? "bg-gray-200 cursor-not-allowed" : ""
                  }`}
                  aria-label={`Select Label for Annotation ${annotation.id}`}
                >
                  <option value="">
                    {annotation.label?.name || "Select Label"}
                  </option>
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
                  aria-label={`Toggle Visibility for Annotation ${annotation.id}`}
                >
                  {hiddenAnnotations.includes(annotation.id) ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
                {isEditor && (
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeAnnotation(annotation.id)}
                    aria-label={`Remove Annotation ${annotation.id}`}
                  >
                    <FiTrash />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          style={{
            width: '100%',
            height: '100%',
          }}
          center={center}
          zoom={1}
          crs={L.CRS.Simple}
          attributionControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
          maxZoom={4} // Optional: Limit zoom level based on image size
        >
          {/* Fit map to bounds */}
          <FitBounds bounds={bounds} />

          {/* Image Overlay */}
          <ImageOverlay url={`${backendUrl}/${image.filePath}`} bounds={bounds} />

          {/* Annotations with Editing Controls */}
          <FeatureGroup ref={featureGroupRef}>
            {annotations.map((annotation) => {
              if (hiddenAnnotations.includes(annotation.id)) return null;
              const labelColor = annotation.label?.color || "#3388ff";

              if (annotation.coordinates && annotation.coordinates.length > 0) {
                return (
                  <Polygon
                    key={annotation.id}
                    positions={annotation.coordinates}
                    pathOptions={{
                      color: labelColor,
                      weight: 1,
                      opacity: 1,
                      fillOpacity: 0.2,
                    }}
                  />
                );
              } else if (annotation.bounds) {
                return (
                  <Rectangle
                    key={annotation.id}
                    bounds={[
                      annotation.bounds.southWest,
                      annotation.bounds.northEast,
                    ]}
                    pathOptions={{
                      color: labelColor,
                      weight: 1,
                      opacity: 1,
                      fillOpacity: 0.2,
                    }}
                  />
                );
              }
              return null;
            })}
            {isEditor && (
              <EditControl
                position="topright"
                onCreated={handleCreated}
                draw={{
                  rectangle: true,
                  circle: false,
                  marker: false,
                  polygon: { shapeOptions: { weight: 1 } },
                  circlemarker: false,
                  polyline: false,
                }}
                edit={{
                  edit: true,
                  remove: false,
                }}
              />
            )}
          </FeatureGroup>

          {/* Annotations without Editing Controls (for visitors) */}
          {!isEditor && (
            <FeatureGroup>
              {annotations.map((annotation) => {
                if (hiddenAnnotations.includes(annotation.id)) return null;
                const labelColor = annotation.label?.color || "#3388ff";
                if (annotation.coordinates && annotation.coordinates.length > 0) {
                  return (
                    <Polygon
                      key={annotation.id}
                      positions={annotation.coordinates}
                      pathOptions={{
                        color: labelColor,
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.2,
                      }}
                    />
                  );
                } else if (annotation.bounds) {
                  return (
                    <Rectangle
                      key={annotation.id}
                      bounds={[
                        annotation.bounds.southWest,
                        annotation.bounds.northEast,
                      ]}
                      pathOptions={{
                        color: labelColor,
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.2,
                      }}
                    />
                  );
                }
                return null;
              })}
            </FeatureGroup>
          )}
        </MapContainer>
      </div>

      {/* AddLabelModal */}
      <AddLabelModal
        isOpen={isAddLabelModalOpen}
        onClose={toggleAddLabelModal}
        toggleLabelModal={toggleAddLabelModal}
        projectId={projectId}
      />
    </div>
  );
}
