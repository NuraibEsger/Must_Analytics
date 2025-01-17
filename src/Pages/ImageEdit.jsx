import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Line,
  Circle,
} from "react-konva";
import useImage from "use-image";
import { useParams } from "react-router-dom";
import {
  getImageById,
  saveAnnotations,
  updateAnnotationLabel,
  deleteAnnotation,
} from "../services/imageService";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import {
  FiEye,
  FiTrash,
  FiBox,
  FiEyeOff,
  FiPlus,
  FiSquare,
  FiCommand,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import AddLabelModal from "../components/AddLabelModal";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useDebouncedCallback } from "use-debounce";
import { getLabelsByProjectId } from "../services/labelService";

const Loading = () => (
  <div className="flex justify-center items-center h-full w-full">
    <ClipLoader color="#000" size={50} />
    <span className="ml-2">Loading image...</span>
  </div>
);

export default function ImageEdit() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const currentUserEmail = useSelector((state) => state.account.email);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Annotation, label, and permission states
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [isAddLabelModalOpen, setIsAddLabelModalOpen] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [projectId, setProjectId] = useState(null);

  // Image properties
  const [imageDimensions, setImageDimensions] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Drawing state
  // drawingMode can be "" | "rectangle" | "polygon"
  const [drawingMode, setDrawingMode] = useState("");
  // For rectangles we use newAnnotation as before.
  const [newAnnotation, setNewAnnotation] = useState(null);
  // For polygon drawing we now use additional state:
  const [polygonPoints, setPolygonPoints] = useState([]); // array of [x, y]
  const [curMousePos, setCurMousePos] = useState(null);
  const [isPolygonFinished, setIsPolygonFinished] = useState(false);
  // Track which polygon point is hovered (index in polygonPoints)
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Stage pan/zoom state
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Fetch image and related data
  const { isLoading, isError, error } = useQuery({
    queryKey: ["image", id],
    queryFn: () => getImageById(id),
    onSuccess: (data) => {
      if (data.image) {
        setAnnotations(data.image.annotations || []);
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageUrl(`${backendUrl}/${data.image.filePath}`);
        };
        img.onerror = (err) => {
          console.error("Error loading image dimensions:", err);
          toast.error("Error loading image dimensions.");
        };
        img.src = `${backendUrl}/${data.image.filePath}`;
      }
      if (data.projectId) {
        setProjectId(data.projectId);
        const foundMember = data.members.find(
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
  });

  const { data: labelsData } = useQuery(
    ["labels", projectId],
    () => getLabelsByProjectId(projectId),
    { enabled: !!projectId } // only run if projectId exists
  );

  // Mutation for saving annotations
  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations),
    onMutate: async (newAnnotations) => {
      await queryClient.cancelQueries({ queryKey: ["image", id] });
      const previousData = queryClient.getQueryData({ queryKey: ["image", id] });
      queryClient.setQueryData({ queryKey: ["image", id] }, (oldData) => {
        const oldAnnotations = (oldData && oldData.image && oldData.image.annotations) || [];
        return {
          ...oldData,
          image: {
            ...oldData.image,
            annotations: [...oldAnnotations, ...newAnnotations],
          },
        };
      });
      return { previousData };
    },
    onError: (err, context) => {
      if (context?.previousData)
        queryClient.setQueryData(
          { queryKey: ["image", id] },
          context.previousData
        );
      console.error("Error saving annotations:", err);
      toast.error("Failed to save annotations.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["image", id] });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["ProjectStatistics", projectId],
        });
      }
    },
    onSuccess: () => {
      toast.success("Annotations saved successfully!", {
        position: "top-right",
        autoClose: 1000,
      });
    },
  });

  const updateLabelMutation = useMutation(
    ({ annotationId, labelId }) => updateAnnotationLabel(annotationId, labelId),
    {
      onSuccess: (data, variables) => {
        const updatedAnnotation = data.annotation;
        setAnnotations((prevAnnotations) =>
          prevAnnotations.map((ann) =>
            ann._id === variables.annotationId ? updatedAnnotation : ann
          )
        );
        toast.success("Annotation label updated.");
      },
      onError: (error) => {
        console.error("Error updating label:", error);
        toast.error("Failed to update annotation label.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["image", id]);
      },
    }
  );

  const deleteAnnotationMutation = useMutation(
    (annotationId) => deleteAnnotation(annotationId),
    {
      onSuccess: (_, annotationId) => {
        setAnnotations((prevAnnotations) =>
          prevAnnotations.filter((ann) => ann._id !== annotationId)
        );
        toast.success("Annotation removed successfully.");
      },
      onError: (error) => {
        console.error("Error deleting annotation:", error);
        toast.error("Failed to remove annotation.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["image", id]);
      },
    }
  );

  const debouncedSave = useDebouncedCallback(
    (newAnnotations) => {
      mutation.mutate(newAnnotations);
    },
    500 // delay
  );

  // Toggle Add Label modal
  const toggleAddLabelModal = () => {
    setIsAddLabelModalOpen(!isAddLabelModalOpen);
  };

  // Handle label selection changes
  const handleLabelChange = (annotationId, labelId) => {
    if (!isEditor) return;

    updateLabelMutation.mutate({ annotationId, labelId });
  };

  // Remove an annotation
  const removeAnnotation = (annotationId) => {
    if (!isEditor) return;

    deleteAnnotationMutation.mutate(annotationId);
  };

  // Toggle annotation visibility
  const toggleVisibility = (annotationId) => {
    setHiddenAnnotations((prev) =>
      prev.includes(annotationId)
        ? prev.filter((id) => id !== annotationId)
        : [...prev, annotationId]
    );
  };

  // Konva stage ref
  const stageRef = useRef(null);

  // Finalize polygon annotation.
  const finalizePolygon = useCallback(() => {
    if (polygonPoints.length < 3) {
      toast.error("A polygon must have at least 3 points.");
      return;
    }
    // Flatten the array-of-arrays into a single array.
    const flattenedPoints = polygonPoints.reduce(
      (acc, curr) => acc.concat(curr),
      []
    );
    // Close the polygon by appending the first point.
    const closedPoints = [
      ...flattenedPoints,
      polygonPoints[0][0],
      polygonPoints[0][1],
    ];
    const annotationWithId = {
      type: "polygon",
      coordinates: closedPoints, // a flat array of numbers
      label: null,
    };
    const updatedAnnotations = [...annotations, annotationWithId];
    setAnnotations((prev) => [...prev, annotationWithId]);
    debouncedSave([annotationWithId]);
    // Reset polygon drawing state.
    setPolygonPoints([]);
    setCurMousePos(null);
    setIsPolygonFinished(false);
    setDrawingMode("");
    setHoveredPointIndex(null);
  }, [polygonPoints, annotations, debouncedSave]);
  // ----------------------------
  // KEYBOARD HANDLERS
  // ----------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only allow shortcuts when in editor mode
      if (!isEditor) return;
  
      // Toggle polygon mode using "f" key:
      if (e.key.toLowerCase() === "f") {
        if (drawingMode === "polygon") {
          // If polygon mode is already on, turn it off.
          setDrawingMode("");
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setNewAnnotation(null);
          setHoveredPointIndex(null);
        } else {
          // Activate polygon drawing mode.
          setDrawingMode("polygon");
          // Reset polygon drawing state.
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setNewAnnotation(null);
          setHoveredPointIndex(null);
        }
      }
      // Toggle rectangle mode using "d" key:
      else if (e.key.toLowerCase() === "d") {
        if (drawingMode === "rectangle") {
          // If rectangle mode is already on, turn it off.
          setDrawingMode("");
          setNewAnnotation(null);
        } else {
          // Activate rectangle drawing mode.
          setDrawingMode("rectangle");
          // Reset rectangle (and polygon) drawing state.
          setNewAnnotation(null);
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setHoveredPointIndex(null);
        }
      }
      // If in polygon mode and Enter is pressed, finalize polygon:
      else if (drawingMode === "polygon" && e.key === "Enter") {
        if (polygonPoints.length < 3) {
          toast.error("A polygon must have at least 3 points.");
          return;
        }
        finalizePolygon();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditor, drawingMode, polygonPoints, finalizePolygon]);

  // ----------------------------
  // MOUSE HANDLERS FOR DRAWING
  // ----------------------------
  // Helper to convert stage coordinates to relative ones.
  const getRelativePos = (pos) => ({
    x: (pos.x - stagePosition.x) / stageScale,
    y: (pos.y - stagePosition.y) / stageScale,
  });

  // Mouse down:
  // - For rectangle, initiate drawing.
  // - For polygon, add new point or finish if close to starting point.
  const handleMouseDown = (e) => {
    if (!isEditor || !drawingMode) return;
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const relPos = getRelativePos(pointerPos);

    if (drawingMode === "rectangle") {
      setNewAnnotation({
        type: "rectangle",
        x: relPos.x,
        y: relPos.y,
        width: 0,
        height: 0,
      });
      return;
    }

    if (drawingMode === "polygon") {
      // If we have at least 3 points, check if clicked close to the first one.
      if (polygonPoints.length >= 3) {
        const [startX, startY] = polygonPoints[0];
        const dx = relPos.x - startX;
        const dy = relPos.y - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
          // Close the polygon
          setIsPolygonFinished(true);
          finalizePolygon();
          return;
        }
      }
      // Otherwise, add new point.
      setPolygonPoints([...polygonPoints, [relPos.x, relPos.y]]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const relPos = getRelativePos(pointerPos);

    if (!isEditor) return;

    // For rectangle drawing, update dimensions.
    if (newAnnotation && newAnnotation.type === "rectangle") {
      const newWidth = relPos.x - newAnnotation.x;
      const newHeight = relPos.y - newAnnotation.y;
      setNewAnnotation({
        ...newAnnotation,
        width: newWidth,
        height: newHeight,
      });
      return;
    }

    // For polygon drawing, update current mouse position (for live preview)
    if (drawingMode === "polygon") {
      setCurMousePos([relPos.x, relPos.y]);
    }
  };

  // Mouse up is used for rectangles; polygons finish on click.
  const handleMouseUp = () => {
    if (!isEditor) return;
    if (newAnnotation && newAnnotation.type === "rectangle") {
      const annotationWithId = {
        type: "rectangle",
        x: newAnnotation.x,
        y: newAnnotation.y,
        width: newAnnotation.width,
        height: newAnnotation.height,
        label: null,
      };
      const updatedAnnotations = [...annotations, annotationWithId];
      setAnnotations(updatedAnnotations);
      debouncedSave([newAnnotation]);
      setNewAnnotation(null);
      setDrawingMode("");
    }
  };

  // ----------------------------
  // PAN / ZOOM HANDLERS
  // ----------------------------
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePosition(newPos);
  };

  const handleDragEnd = (e) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // Load the image.
  const [konvaImage] = useImage(imageUrl, "Anonymous");

  if (isLoading || !imageDimensions || !imageUrl || !konvaImage) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        Error loading image: {error?.message || "Unknown error"}
      </div>
    );
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scale = Math.min(
    viewportWidth / imageDimensions.width,
    viewportHeight / imageDimensions.height
  );
  const imageX = (viewportWidth - imageDimensions.width * scale) / 2;
  const imageY = (viewportHeight - imageDimensions.height * scale) / 2;
  const stageWidth = viewportWidth;
  const stageHeight = viewportHeight;

  // Compute the points for the current, in-progress polygon.
  let previewPolygonPoints = [];
  if (drawingMode === "polygon" && polygonPoints.length > 0) {
    previewPolygonPoints = polygonPoints.reduce(
      (acc, curr) => acc.concat(curr),
      []
    );
    if (curMousePos) {
      previewPolygonPoints = previewPolygonPoints.concat(curMousePos);
    }
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Sidebar for Annotations */}
      <div className="w-96 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
          Annotations ({annotations.length})
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
        <ul className="space-y-2">
          {annotations.map((annotation, idx) => (
            <li
              key={`${annotation._id}-${idx}`}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <FiBox />
                <select
                  disabled={!isEditor} // Only allow editors to change the label
                  value={annotation.label?._id || ""}
                  onChange={(e) =>
                    handleLabelChange(annotation._id, e.target.value)
                  }
                  className={`border border-gray-300 rounded-md px-2 py-1 ${
                    !isEditor ? "bg-gray-200 cursor-not-allowed" : ""
                  }`}
                  aria-label={`Select Label for Annotation ${annotation._id}`}
                >
                  <option value="" disabled={annotation.label}>
                    {"Select Label"}
                  </option>
                  {labelsData.map((label) => (
                    <option
                      key={label._id}
                      value={label._id}
                      // If this label is currently assigned, disable it in the options list.
                      disabled={annotation.label?._id === label._id}
                    >
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => toggleVisibility(annotation._id)}
                  aria-label={`Toggle Visibility for Annotation ${annotation._id}`}
                >
                  {hiddenAnnotations.includes(annotation._id) ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
                {isEditor && (
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeAnnotation(annotation._id)}
                    aria-label={`Remove Annotation ${annotation._id}`}
                  >
                    <FiTrash />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Konva Stage */}
      <div className="relative">
        {isEditor && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              className={`px-3 py-1 rounded border ${
                drawingMode === "rectangle"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => {
                // If currently in rectangle mode, toggle it off.
                if (drawingMode === "rectangle") {
                  setDrawingMode("");
                  setNewAnnotation(null);
                } else {
                  // Otherwise, activate rectangle drawing:
                  setDrawingMode("rectangle");
                  // Reset all drawing-related state:
                  setNewAnnotation(null);
                  setPolygonPoints([]);
                  setCurMousePos(null);
                  setIsPolygonFinished(false);
                  setHoveredPointIndex(null);
                }
              }}
            >
              <FiSquare size={20} />
            </button>
            <button
              className={`px-3 py-1 rounded border ${
                drawingMode === "polygon"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => {
                // If currently in polygon mode, toggle it off.
                if (drawingMode === "polygon") {
                  setDrawingMode("");
                  setPolygonPoints([]);
                } else {
                  // Otherwise, activate polygon drawing:
                  setDrawingMode("polygon");
                  // Reset all drawing-related state:
                  setPolygonPoints([]);
                  setCurMousePos(null);
                  setIsPolygonFinished(false);
                  setNewAnnotation(null);
                  setHoveredPointIndex(null);
                }
              }}
            >
              <FiCommand size={20} />
            </button>
          </div>
        )}

        <Stage
          width={stageWidth - 300}
          height={stageHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onDragEnd={handleDragEnd}
          draggable={newAnnotation === null && drawingMode === ""}
          ref={stageRef}
          style={{ background: "#ddd", cursor: drawingMode ? "crosshair" : "default" }}
          className="bg-slate-400"
        >
          <Layer>
            <KonvaImage image={konvaImage} x={imageX} y={imageY} />
            {annotations.map((ann) => {
              if (hiddenAnnotations.includes(ann._id)) return null;

              if (ann.type === "rectangle") {
                const x = ann.x ?? (ann.bbox && ann.bbox[0]);
                const y = ann.y ?? (ann.bbox && ann.bbox[1]);
                const width = ann.width ?? (ann.bbox && ann.bbox[2]);
                const height = ann.height ?? (ann.bbox && ann.bbox[3]);

                if (x == null || y == null || width == null || height == null) {
                  return null;
                }

                return (
                  <Rect
                    key={ann._id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke={ann.label?.color || "blue"}
                    strokeWidth={2}
                    dash={[4, 4]}
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOffsetX={5}
                    shadowOffsetY={5}
                  />
                );
              }

              if (ann.type === "polygon") {
                const flattenCoordinates = (coordinates) => {
                  if (Array.isArray(coordinates[0])) {
                    return coordinates[0];
                  }
                  return coordinates;
                };
                const flatPoints = flattenCoordinates(ann.coordinates);
                return (
                  <React.Fragment key={ann._id}>
                    <Line
                      points={flatPoints}
                      stroke={ann.label?.color || "blue"}
                      strokeWidth={3}
                      lineJoin="round"
                      lineCap="round"
                      closed
                      dash={[4, 4]}
                      shadowColor="black"
                      shadowBlur={10}
                      shadowOffsetX={5}
                      shadowOffsetY={5}
                    />
                    {flatPoints.map((point, index) => {
                      if (index % 2 === 0) {
                        const x = point;
                        const y = flatPoints[index + 1];
                        return (
                          <Circle
                            key={`${ann._id}-point-${index}`}
                            x={x}
                            y={y}
                            radius={4}
                            fill="black"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    })}
                  </React.Fragment>
                );
              }

              return null;
            })}

            {/* Render the new annotation (in-progress rectangle) if any */}
            {newAnnotation && newAnnotation.type === "rectangle" && (
              <Rect
                x={newAnnotation.x}
                y={newAnnotation.y}
                width={newAnnotation.width}
                height={newAnnotation.height}
                stroke="red"
                strokeWidth={2}
                dash={[4, 4]}
              />
            )}

            {/* Render the in-progress polygon preview */}
            {drawingMode === "polygon" && previewPolygonPoints.length > 0 && (
              <>
                <Line
                  points={previewPolygonPoints}
                  stroke="blue"
                  strokeWidth={3}
                  lineJoin="round"
                  lineCap="round"
                  dash={[4, 4]}
                />
                {polygonPoints.map((point, idx) => (
                  <Circle
                    key={`polygon-point-${idx}`}
                    x={point[0]}
                    y={point[1]}
                    radius={hoveredPointIndex === idx ? 10 : 6}
                    fill={hoveredPointIndex === idx ? "orange" : "blue"}
                    stroke="black"
                    strokeWidth={2}
                    draggable
                    onDragMove={(e) => {
                      const newPoint = [e.target.x(), e.target.y()];
                      setPolygonPoints((prevPoints) =>
                        prevPoints.map((pt, index) =>
                          index === idx ? newPoint : pt
                        )
                      );
                    }}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      </div>

      <AddLabelModal
        isOpen={isAddLabelModalOpen}
        onClose={toggleAddLabelModal}
        toggleLabelModal={toggleAddLabelModal}
        projectId={projectId}
      />
    </div>
  );
}
