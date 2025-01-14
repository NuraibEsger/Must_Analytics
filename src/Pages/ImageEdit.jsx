import React, { useState, useRef, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle } from "react-konva";
import useImage from "use-image";
import { useParams } from "react-router-dom";
import { getImageById, saveAnnotations } from "../services/imageService";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { FiEye, FiTrash, FiBox, FiEyeOff, FiPlus } from "react-icons/fi";
import { useSelector } from "react-redux";
import AddLabelModal from "../components/AddLabelModal";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useDebouncedCallback } from "use-debounce";

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
  const [labels, setLabels] = useState([]);
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
        setLabels(data.labels || []);
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
        const foundMember = data.members.find((m) => m.email === currentUserEmail);
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

  // Mutation for saving annotations
  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations),
    onMutate: async (newAnnotations) => {
      await queryClient.cancelQueries({ queryKey: ["image", id] });
      const previousData = queryClient.getQueryData({ queryKey: ["image", id] });
      queryClient.setQueryData({ queryKey: ["image", id] }, (oldData) => ({
        ...oldData,
        image: { ...oldData.image, annotations: newAnnotations },
      }));
      return { previousData };
    },
    onError: (err, context) => {
      if (context?.previousData)
        queryClient.setQueryData({ queryKey: ["image", id] }, context.previousData);
      console.error("Error saving annotations:", err);
      toast.error("Failed to save annotations.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["image", id] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["ProjectStatistics", projectId] });
      }
    },
    onSuccess: () => {
      toast.success("Annotations saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    },
  });

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
    const selectedLabel = labels.find((label) => label._id === labelId);
    if (!selectedLabel) return;
    const updatedAnnotations = annotations.map((annotation) =>
      annotation._id === annotationId ? { ...annotation, label: selectedLabel } : annotation
    );
    setAnnotations(updatedAnnotations);
    debouncedSave(updatedAnnotations);
  };

  // Remove an annotation
  const removeAnnotation = (annotationId) => {
    if (!isEditor) return;
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation._id !== annotationId
    );
    setAnnotations(updatedAnnotations);
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

  // Konva stage ref
  const stageRef = useRef(null);

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
        ...newAnnotation,
        _id: Date.now().toString(),
        label: null,
      };
      const updatedAnnotations = [...annotations, annotationWithId];
      setAnnotations(updatedAnnotations);
      debouncedSave(updatedAnnotations);
      setNewAnnotation(null);
      setDrawingMode("");
    }
  };

  // Finalize polygon annotation.
  const finalizePolygon = useCallback(() => {
    if (polygonPoints.length < 3) {
      toast.error("A polygon must have at least 3 points.");
      return;
    }
    // Flatten the array-of-arrays into a single array.
    const flattenedPoints = polygonPoints.reduce((acc, curr) => acc.concat(curr), []);
    // Close the polygon by appending the first point.
    const closedPoints = [...flattenedPoints, polygonPoints[0][0], polygonPoints[0][1]];
    const annotationWithId = {
      type: "polygon",
      points: closedPoints,
      _id: Date.now().toString(),
      label: null,
    };
    const updatedAnnotations = [...annotations, annotationWithId];
    setAnnotations(updatedAnnotations);
    debouncedSave(updatedAnnotations);
    // Reset polygon drawing state.
    setPolygonPoints([]);
    setCurMousePos(null);
    setIsPolygonFinished(false);
    setDrawingMode("");
    setHoveredPointIndex(null);
  }, [polygonPoints, annotations, debouncedSave]);

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
    previewPolygonPoints = polygonPoints.reduce((acc, curr) => acc.concat(curr), []);
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
        {mutation.isLoading && (
          <div className="flex justify-center items-center mt-2">
            <ClipLoader color="#000" size={20} />
          </div>
        )}
        <ul className="space-y-2">
          {annotations.map((annotation) => (
            <li
              key={annotation._id}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <FiBox />
                <select
                  disabled={!isEditor}
                  value={annotation.label?._id || ""}
                  onChange={(e) =>
                    handleLabelChange(annotation._id, e.target.value)
                  }
                  className={`border border-gray-300 rounded-md px-2 py-1 ${
                    !isEditor ? "bg-gray-200 cursor-not-allowed" : ""
                  }`}
                  aria-label={`Select Label for Annotation ${annotation._id}`}
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
                setDrawingMode("rectangle");
                setNewAnnotation(null);
                setPolygonPoints([]);
                setCurMousePos(null);
                setIsPolygonFinished(false);
                setHoveredPointIndex(null);
              }}
            >
              Rectangle
            </button>
            <button
              className={`px-3 py-1 rounded border ${
                drawingMode === "polygon"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => {
                setDrawingMode("polygon");
                setPolygonPoints([]);
                setCurMousePos(null);
                setIsPolygonFinished(false);
                setNewAnnotation(null);
                setHoveredPointIndex(null);
              }}
            >
              Polygon
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
          style={{ background: "#ddd" }}
          className="bg-slate-400"
        >
          <Layer>
            <KonvaImage image={konvaImage} x={imageX} y={imageY} />
            {annotations.map((ann) => {
              if (hiddenAnnotations.includes(ann._id)) return null;
              if (ann.type === "rectangle") {
                return (
                  <Rect
                    key={ann._id}
                    x={ann.x}
                    y={ann.y}
                    width={ann.width}
                    height={ann.height}
                    stroke={ann.label?.color || "blue"}
                    strokeWidth={2}
                    dash={[4, 4]}
                  />
                );
              }
              if (ann.type === "polygon") {
                return (
                  <React.Fragment key={ann._id}>
                    <Line
                      points={ann.points}
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
                    {ann.points.map((point, index) => {
                      if (index % 2 === 0) {
                        const x = point;
                        const y = ann.points[index + 1];
                        return (
                          <Circle
                            key={`${ann._id}-point-${index}`}
                            x={x}
                            y={y}
                            radius={6}
                            fill="red"
                            stroke="black"
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
                {/* Render draggable circles for each saved polygon point with hover behavior */}
                {polygonPoints.map((point, idx) => (
                  <Circle
                    key={`polygon-point-${idx}`}
                    x={point[0]}
                    y={point[1]}
                    radius={hoveredPointIndex === idx ? 10 : 6} // enlarge when hovered
                    fill={hoveredPointIndex === idx ? "orange" : "blue"}
                    stroke="black"
                    strokeWidth={2}
                    draggable
                    onDragMove={(e) => {
                      // Update the dragged point.
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
