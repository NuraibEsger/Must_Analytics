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
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useDebouncedCallback } from "use-debounce";

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
  // State variables
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [imageDimensions, setImageDimensions] = useState(null); // Image natural dimensions
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

  const queryClient = useQueryClient();

  // Fetch image, annotations, and labels using useQuery
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["image", id],
    queryFn: () => getImageById(id, token),
    onSuccess: (data) => {
      if (data.image) {
        setAnnotations(data.image.annotations || []);
        setLabels(data.labels || []);

        // Load the image to get its natural dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.onerror = (err) => {
          console.error("Error loading image for dimensions:", err);
          toast.error("Error loading image dimensions.");
        };
        img.src = `${backendUrl}/${data.image.filePath}`;
      }
      if (data.projectId) {
        setProjectId(data.projectId);
        const members = data.members;
        // Find user’s membership
        const foundMember = members.find(
          (m) => m.email === currentUserEmail
        );
        if (foundMember?.role === "editor") {
          setIsEditor(true);
        }
      }
    },
    onError: (err) => {
      console.error("Error fetching image:", err);
      toast.error("Error fetching image data.");
    },
    // Optional: Configure refetch behavior
    // refetchOnWindowFocus: false,
  });

  const toggleAddLabelModal = () => {
    setIsAddLabelModalOpen(!isAddLabelModalOpen);
  };

  // Define a mutation for saving annotations
  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations, token),
    onSuccess: () => {
      toast.success("Annotations saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      // Optionally, invalidate or refetch queries if needed
      queryClient.invalidateQueries({ queryKey: ["image", id] });

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["ProjectStatistics", projectId] });
      }
    },
    onError: (err) => {
      console.error("Error saving annotations:", err);
      toast.error("Failed to save annotations.");
    },
  });

  // Define a debounced version of the mutate function
  const debouncedSave = useDebouncedCallback(
    (newAnnotations) => {
      mutation.mutate(newAnnotations);
    },
    500 // 500ms delay
  );

  // Handle new shapes
  const handleCreated = (e) => {
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

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);

    // Trigger mutation to save annotations
    debouncedSave(updatedAnnotations);
  };

  // Handle label changes
  const handleLabelChange = (annotationId, labelId) => {
    if (!isEditor) return;

    const selectedLabel = labels.find((label) => label._id === labelId);
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === annotationId
        ? { ...annotation, label: selectedLabel }
        : annotation
    );
    setAnnotations(updatedAnnotations);

    // Trigger mutation to save annotations
    debouncedSave(updatedAnnotations);
  };

  // Remove annotations
  const removeAnnotation = (annotationId) => {
    if (!isEditor) return;
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation.id !== annotationId
    );
    setAnnotations(updatedAnnotations);

    // Trigger mutation to save annotations
    debouncedSave(updatedAnnotations);
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
    return [scaledDimensions.height / 2, scaledDimensions.width / 2];
  }, [scaledDimensions]);

  // Handle image loading state
  if (isLoading || !imageDimensions) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <ClipLoader color="#000" size={50} />
        <span className="ml-2">Loading image...</span>
      </div>
    );
  }

  // Handle error state
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
          {/* Removed Save Button */}
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

        {/* Loading indicator for save operation */}
        {mutation.isLoading && (
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
            width: `${mapWidth}px`,
            height: `${mapHeight}px`,
          }}
          center={center}
          zoom={1}
          crs={L.CRS.Simple}
          attributionControl={false}
          maxZoom={4} // Optional: Limit zoom level based on image size
        >
          {/* Fit map to bounds */}
          <FitBounds bounds={bounds} />

          {/* Image Overlay */}
          <ImageOverlay url={`${backendUrl}/${data.image.filePath}`} bounds={bounds} />

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
