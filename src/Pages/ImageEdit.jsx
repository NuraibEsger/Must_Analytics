// ImageEdit.jsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  createRef,
} from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Line,
  Circle,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import LoadingBar from "react-top-loading-bar";
import { useParams } from "react-router-dom";
import {
  getImageById,
  saveAnnotations,
  updateAnnotationLabel,
  deleteAnnotation,
  updateAnnotation, // ensure this is imported from your services
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
  FiTarget,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import AddLabelModal from "../components/AddLabelModal";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useDebouncedCallback } from "use-debounce";
import { getLabelsByProjectId } from "../services/labelService";
import moveIcon from '../images/move.png'

// A helper component for enabling the transformer
const TransformerComponent = ({ selectedShapeRef }) => {
  const transformerRef = useRef(null);
  useEffect(() => {
    if (selectedShapeRef.current) {
      transformerRef.current.nodes([selectedShapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeRef]);
  return <Transformer ref={transformerRef} />;
};

const Loading = () => (
  <div className="flex justify-center items-center h-full w-full">
    <ClipLoader color="#000" size={50} />
    <span className="ml-2">Loading image...</span>
  </div>
);

const ZOOM_FACTOR = 0.8;

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

  // NEW: State to track currently editing annotation.
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);

  // New states for selection mode.
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Hovered State
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

  // Image properties
  const [imageDimensions, setImageDimensions] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Drawing state:
  // drawingMode can be "" | "rectangle" | "polygon"
  const [drawingMode, setDrawingMode] = useState("");
  // For rectangles we use newAnnotation.
  const [newAnnotation, setNewAnnotation] = useState(null);
  // For polygon drawing state:
  const [polygonPoints, setPolygonPoints] = useState([]); // array of [x, y]
  const [curMousePos, setCurMousePos] = useState(null);
  const [isPolygonFinished, setIsPolygonFinished] = useState(false);
  // Track which polygon point is hovered (index in polygonPoints)
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  const [progress, setProgress] = useState(0);

  // Stage pan/zoom state
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  const [isStageInitialized, setIsStageInitialized] = useState(false);

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
  
          // Calculate initial scale with zoom factor
          const initialScale = Math.min(
            (window.innerWidth - 300) / img.width, // 300px sidebar
            window.innerHeight / img.height
          ) * ZOOM_FACTOR;
  
          // Calculate image position to center it
          const imageX = ((window.innerWidth - 300) - img.width * initialScale) / 2;
          const imageY = (window.innerHeight - img.height * initialScale) / 2;
  
          // Set initial scale and position only if not already set
          if (!isStageInitialized) {
            setStageScale(initialScale);
            setStagePosition({ x: imageX, y: imageY });
            setIsStageInitialized(true);
          }
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
    { enabled: !!projectId }
  );
  

  // Mutation for saving annotations (for new ones)
  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations),
    onMutate: async (newAnnotations) => {
      setProgress(30);

      await queryClient.cancelQueries({ queryKey: ["image", id] });
      const previousData = queryClient.getQueryData({
        queryKey: ["image", id],
      });
      queryClient.setQueryData({ queryKey: ["image", id] }, (oldData) => {
        const oldAnnotations =
          (oldData && oldData.image && oldData.image.annotations) || [];
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
        queryClient.invalidateQueries(["ProjectImages", projectId]);
      }
    },
    onSuccess: () => {
      setProgress(100);
    },
  });

  // Mutation for updating annotation label (unchanged)
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

  // NEW: Mutation for updating an annotation (coordinates, bbox, etc.)
  const updateAnnotationMutation = useMutation(
    ({ annotationId, data }) => updateAnnotation(annotationId, data),
    {
      onMutate: () => {
        setProgress(30);
      },
      onSuccess: (data, variables) => {
        const updatedData = data.data.annotation;
        
        setAnnotations((prevAnnotations) =>
          prevAnnotations.map((ann) => {
            if (ann._id === variables.annotationId) {
              return {
                ...ann,
                ...updatedData, // Merge updated fields
                label: ann.label, // Preserve existing label
              };
            }
            return ann;
          })
        );
        // Complete the progress bar
        setProgress(100);
        // Optionally, reset after a moment
      },
      onError: (error) => {
        console.error("Error updating annotation:", error);
        setProgress(0);
        toast.error("Failed to update annotation.");
      },
      onSettled: () => {
        // Optionally, you can also invalidate queries here
        queryClient.invalidateQueries({ queryKey: ["image", id] });
      },
    }
  );
  
  

  // Mutation for deleting an annotation (unchanged)
  const deleteAnnotationMutation = useMutation(
    (annotationId) => deleteAnnotation(annotationId),
    {
      onMutate: () => {
        setProgress(30);
      },
      onSuccess: (_, annotationId) => {
        setAnnotations((prevAnnotations) =>
          prevAnnotations.filter((ann) => ann._id !== annotationId)
        );
        setProgress(100);
      },
      onError: (error) => {
        console.error("Error deleting annotation:", error);
        toast.error("Failed to remove annotation.");
      },
      onSettled: () => {
        if (projectId) {
          queryClient.invalidateQueries(["image", id]);
          queryClient.invalidateQueries(["ProjectImages", projectId]);
          queryClient.invalidateQueries({
            queryKey: ["ProjectStatistics", projectId],
          });
        }
      },
    }
  );

  const debouncedSave = useDebouncedCallback((newAnnotations) => {
    mutation.mutate(newAnnotations);
  }, 200);

  const debouncedUpdateAnnotation = useDebouncedCallback(
    ({ annotationId, data }) => {
      updateAnnotationMutation.mutate({
        annotationId,
        data,
      });
    },
    200 // 500ms delay (adjust as needed)
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
    const flattenedPoints = polygonPoints.reduce(
      (acc, curr) => acc.concat(curr),
      []
    );
    const closedPoints = [
      ...flattenedPoints,
      polygonPoints[0][0],
      polygonPoints[0][1],
    ];
    
    // Get the first label from labelsData if available
    const initialLabel =
      (labelsData && Array.isArray(labelsData) ? labelsData[0] : null) || null;
      
    const annotationWithId = {
      type: "polygon",
      coordinates: closedPoints,
      label: initialLabel,
    };
    setAnnotations((prev) => [...prev, annotationWithId]);
    debouncedSave([annotationWithId]);
    // Reset polygon drawing state.
    setPolygonPoints([]);
    setCurMousePos(null);
    setIsPolygonFinished(false);
    setDrawingMode("");
    setHoveredPointIndex(null);
  }, [polygonPoints, debouncedSave, labelsData]);

  // ----------------------------
  // KEYBOARD HANDLERS
  // ----------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditor) return;
      if (e.key.toLowerCase() === "s") {
        if (drawingMode) {
          setDrawingMode("");
          setNewAnnotation(null);
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setHoveredPointIndex(null);
        }
        setIsSelecting((prev) => {
          const newValue = !prev;
          if (!newValue) {
            setSelectedAnnotationId(null);
          }
          return newValue;
        });
        return;
      }
      if (e.key.toLowerCase() === "f") {
        if (drawingMode === "polygon") {
          setDrawingMode("");
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setNewAnnotation(null);
          setHoveredPointIndex(null);
        } else {
          setDrawingMode("polygon");
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setNewAnnotation(null);
          setHoveredPointIndex(null);
        }
        setIsSelecting(false);
      } else if (e.key.toLowerCase() === "d") {
        if (drawingMode === "rectangle") {
          setDrawingMode("");
          setNewAnnotation(null);
        } else {
          setDrawingMode("rectangle");
          setNewAnnotation(null);
          setPolygonPoints([]);
          setCurMousePos(null);
          setIsPolygonFinished(false);
          setHoveredPointIndex(null);
        }
        setIsSelecting(false);
      } else if (drawingMode === "polygon" && e.key === "Enter") {
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
  const getRelativePos = (pos) => ({
    x: (pos.x - stagePosition.x) / stageScale,
    y: (pos.y - stagePosition.y) / stageScale,
  });

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
      if (polygonPoints.length >= 3) {
        const [startX, startY] = polygonPoints[0];
        const dx = relPos.x - startX;
        const dy = relPos.y - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
          setIsPolygonFinished(true);
          finalizePolygon();
          return;
        }
      }
      setPolygonPoints([...polygonPoints, [relPos.x, relPos.y]]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const relPos = getRelativePos(pointerPos);
    if (!isEditor) return;
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
    if (drawingMode === "polygon") {
      setCurMousePos([relPos.x, relPos.y]);
    }
  };

  const handleMouseUp = () => {
    if (!isEditor) return;

    const initialLabel = (labelsData && Array.isArray(labelsData) && labelsData[0]) || null;
    if (newAnnotation && newAnnotation.type === "rectangle") {
      const annotationWithId = {
        type: "rectangle",
        x: newAnnotation.x,
        y: newAnnotation.y,
        width: newAnnotation.width,
        height: newAnnotation.height,
        label: initialLabel,
      };
      setAnnotations((prev) => [...prev, annotationWithId]);
      debouncedSave([annotationWithId]);
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
    setStagePosition({ x: e.target.x(), y: e.target.y() });
  };

  // Load the image.
  const [konvaImage] = useImage(imageUrl, "Anonymous");
  const [fingerIcon] = useImage(moveIcon, "Anonymous");

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
      <LoadingBar
        color="#4caf50" // green color
        progress={progress}
        height={4}
        onLoaderFinished={() => setProgress(0)}
      />
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
          {annotations
            ?.filter((a) => a !== undefined && a !== null)
            .map((annotation, idx) => (
              <li
                key={`${annotation._id}-${idx}`}
                className={`flex justify-between items-center bg-gray-50 p-2 rounded cursor-pointer ${
                  selectedAnnotationId === annotation._id
                    ? "ring-2 ring-indigo-600"
                    : ""
                }`}
                onClick={() => {
                  if (isSelecting) {
                    setSelectedAnnotationId(annotation._id);
                    setEditingAnnotationId(annotation._id);
                  }
                }}
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
                    <option value="" disabled={annotation.label}>
                      Select Label
                    </option>
                    {labelsData && Array.isArray(labelsData)
                      ? labelsData.map((label) => (
                          <option
                            key={label._id}
                            value={label._id}
                            disabled={annotation.label?._id === label._id}
                            style={
                              selectedAnnotationId === annotation._id &&
                              annotation.label?._id === label._id
                                ? { backgroundColor: "#e0f7fa" }
                                : {}
                            }
                          >
                            {label.name}
                          </option>
                        ))
                      : null}
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
                isSelecting
                  ? "bg-green-600 text-white"
                  : "bg-white text-green-600"
              }`}
              onClick={() => {
                if (drawingMode) {
                  setDrawingMode("");
                  setNewAnnotation(null);
                  setPolygonPoints([]);
                  setCurMousePos(null);
                  setIsPolygonFinished(false);
                  setHoveredPointIndex(null);
                }
                setIsSelecting((prev) => {
                  const newValue = !prev;
                  if (!newValue) {
                    setSelectedAnnotationId(null);
                  }
                  return newValue;
                });
              }}
              aria-label="Toggle selection mode"
            >
              <FiTarget size={20} />
            </button>
            <button
              className={`px-3 py-1 rounded border ${
                drawingMode === "rectangle"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => {
                if (drawingMode === "rectangle") {
                  setDrawingMode("");
                  setNewAnnotation(null);
                } else {
                  setDrawingMode("rectangle");
                  setNewAnnotation(null);
                  setPolygonPoints([]);
                  setCurMousePos(null);
                  setIsPolygonFinished(false);
                  setHoveredPointIndex(null);
                  setIsSelecting(false);
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
                if (drawingMode === "polygon") {
                  setDrawingMode("");
                  setPolygonPoints([]);
                } else {
                  setDrawingMode("polygon");
                  setPolygonPoints([]);
                  setCurMousePos(null);
                  setIsPolygonFinished(false);
                  setNewAnnotation(null);
                  setHoveredPointIndex(null);
                  setIsSelecting(false);
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
          style={{
            background: "#ddd",
            cursor: drawingMode ? "crosshair" : "default",
          }}
          className="bg-slate-400"
        >
          <Layer>
            <KonvaImage image={konvaImage} x={imageX} y={imageY} />

            {drawingMode === "rectangle" && newAnnotation && (
              <Rect
                x={newAnnotation.x}
                y={newAnnotation.y}
                width={newAnnotation.width}
                height={newAnnotation.height}
                stroke="silver"
                strokeWidth={2}
                dash={[4, 4]}
                fill="transparent"
              />
            )}

            {/* Polygon Preview - for in-progress polygon drawing */}
            {drawingMode === "polygon" && polygonPoints.length > 0 && (
              <>
                {/* The preview polygon line */}
                <Line
                  points={(() => {
                    let pts = polygonPoints.reduce(
                      (acc, curr) => acc.concat(curr),
                      []
                    );
                    // When hovering, add the current mouse position.
                    if (curMousePos) pts = pts.concat(curMousePos);
                    return pts;
                  })()}
                  stroke="silver"
                  strokeWidth={2}
                  lineJoin="round"
                  lineCap="round"
                  dash={[4, 4]}
                  fill="transparent"
                />
                {/* Render circle markers for each polygon vertex */}
                {polygonPoints.map((pt, index) => (
                  <Circle
                    key={`preview-polygon-point-${index}`}
                    x={pt[0]}
                    y={pt[1]}
                    radius={7}
                    fill="transparent"
                    stroke="silver"
                    strokeWidth={1}
                  />
                ))}
                {/* Optionally, show current mouse position marker */}
                {curMousePos && (
                  <Circle
                    key="preview-current-mouse"
                    x={curMousePos[0]}
                    y={curMousePos[1]}
                    radius={4}
                    fill="orange"
                    stroke="black"
                    strokeWidth={1}
                  />
                )}
              </>
            )}

            {annotations?.map((ann) => {
              if (!ann) return null;
              if (hiddenAnnotations.includes(ann._id)) return null;

              if (ann.type === "rectangle") {
                // Create a ref for this rectangle
                const shapeRef = createRef();
                let x = ann.x,
                  y = ann.y,
                  width = ann.width,
                  height = ann.height;
                if (
                  typeof x !== "number" ||
                  typeof y !== "number" ||
                  typeof width !== "number" ||
                  typeof height !== "number"
                ) {
                  if (ann.bbox) {
                    if (
                      Array.isArray(ann.bbox[0]) &&
                      ann.bbox.length === 1 &&
                      ann.bbox[0].every((v) => typeof v === "number")
                    ) {
                      [x, y, width, height] = ann.bbox[0];
                    } else {
                      [x, y, width, height] = ann.bbox;
                    }
                  } else {
                    return null;
                  }
                }

                return (
                  <React.Fragment key={ann._id}>
                    <Rect
                      ref={shapeRef}
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      stroke={ann.label?.color || "blue"}
                      fill={
                        ann?.label?.color
                          ? `${ann?.label?.color}33`
                          : "transparent"
                      }
                      strokeWidth={
                        hoveredAnnotationId === ann._id
                          ? 6
                          : selectedAnnotationId === ann._id
                          ? 4
                          : 2
                      }
                      dash={[4, 4]}
                      shadowColor="black"
                      shadowBlur={10}
                      shadowOffsetX={5}
                      shadowOffsetY={5}
                      onClick={() => {
                        if (isSelecting) {
                          setSelectedAnnotationId(ann._id);
                          setEditingAnnotationId(ann._id);
                        }
                      }}
                      onMouseEnter={() => setHoveredAnnotationId(ann._id)}
                      onMouseLeave={() => setHoveredAnnotationId(null)}
                      onTransformEnd={(e) => {
                        const node = shapeRef.current;
                        if (!node) return;

                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        // Reset the node's scale so that width/height reflect the actual dimensions.
                        node.scaleX(1);
                        node.scaleY(1);

                        const newX = node.x();
                        const newY = node.y();
                        const newWidth = Math.max(5, node.width() * scaleX);
                        const newHeight = Math.max(5, node.height() * scaleY);

                        // Build bbox array
                        const newBbox = [newX, newY, newWidth, newHeight];

                        // Create updated annotation (preserving _id)
                        const updatedAnnotation = { ...ann, bbox: newBbox };

                        // Optimistically update local state
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a && a._id === ann._id ? updatedAnnotation : a
                          )
                        );

                        // Call the debounced update (PUT endpoint) with bbox
                        debouncedUpdateAnnotation({
                          annotationId: ann._id,
                          data: { bbox: newBbox },
                        });
                      }}
                    />
                    {selectedAnnotationId === ann._id && fingerIcon && (
                      <KonvaImage
                        image={fingerIcon}
                        // Calculate the center of the rectangle.
                        x={x + width / 2 - 16} // offset by half the icon width (e.g., 16 if icon width is 32)
                        y={y + height / 2 - 16} // offset by half the icon height
                        width={32} // adjust size as needed
                        height={32}
                        // Optionally, make it draggable if you wish to move the annotation
                        draggable
                        onDragMove={(e) => {
                          e.cancelBubble = true;
                          // Update the position of the annotation based on drag of this icon.
                          // Compute the new position so that rectangle moves.
                          const dx = e.target.x() - (x + width / 2 - 16);
                          const dy = e.target.y() - (y + height / 2 - 16);

                          // Update annotation coordinates:
                          const updatedAnnotation = {
                            ...ann,
                            x: x + dx,
                            y: y + dy,
                            // If your annotation uses bbox, update it accordingly.
                            bbox: [x + dx, y + dy, width, height],
                          };
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a && a._id === ann._id ? updatedAnnotation : a
                            )
                          );
                        }}
                        onDragEnd={(e) => {
                          e.cancelBubble = true;
                          const dx = e.target.x() - (x + width / 2 - 16);
                          const dy = e.target.y() - (y + height / 2 - 16);

                          const updatedAnnotation = {
                            ...ann,
                            x: x + dx,
                            y: y + dy,
                            bbox: [x + dx, y + dy, width, height],
                          };

                          debouncedUpdateAnnotation({
                            annotationId: ann._id,
                            data: {
                              // You can send x, y, or the entire bbox,
                              // whichever your API expects.
                              x: updatedAnnotation.x,
                              y: updatedAnnotation.y,
                              bbox: updatedAnnotation.bbox,
                            },
                          });
                        }}
                      />
                    )}
                    {selectedAnnotationId === ann._id && (
                      <TransformerComponent selectedShapeRef={shapeRef} />
                    )}
                  </React.Fragment>
                );
              }

              if (ann.type === "polygon") {
                // Unwrapping and flattening logic
                if (!ann.coordinates || ann.coordinates.length === 0) {
                  console.warn("Annotation has no coordinates", ann);
                  return null;
                }

                let flatPoints;
                if (
                  Array.isArray(ann.coordinates[0]) &&
                  ann.coordinates.length === 1 &&
                  ann.coordinates[0].every((v) => typeof v === "number")
                ) {
                  flatPoints = ann.coordinates[0];
                } else if (
                  Array.isArray(ann.coordinates[0]) &&
                  ann.coordinates[0].length === 2
                ) {
                  flatPoints = ann.coordinates.flat();
                } else {
                  flatPoints = ann.coordinates;
                }

                if (!flatPoints.every((p) => typeof p === "number")) {
                  console.error("Invalid points in annotation:", flatPoints);
                  return null;
                }

                // Create control points from flatPoints.
                const controlPoints = [];
                for (let i = 0; i < flatPoints.length; i += 2) {
                  controlPoints.push([flatPoints[i], flatPoints[i + 1]]);
                }

                const centroid = controlPoints.reduce(
                  (acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]],
                  [0, 0]
                );
                centroid[0] /= controlPoints.length;
                centroid[1] /= controlPoints.length;

                return (
                  <React.Fragment key={ann._id}>
                    <Line
                      points={flatPoints}
                      stroke={ann.label?.color || "blue"}
                      strokeWidth={
                        hoveredAnnotationId === ann._id
                          ? 6
                          : selectedAnnotationId === ann._id
                          ? 5
                          : 3
                      }
                      fill={
                        ann.label?.color
                          ? `${ann.label.color}33`
                          : "transparent"
                      }
                      lineJoin="round"
                      lineCap="round"
                      closed
                      dash={[4, 4]}
                      shadowColor="black"
                      shadowBlur={10}
                      shadowOffsetX={5}
                      shadowOffsetY={5}
                      onClick={() => {
                        if (isSelecting) {
                          setSelectedAnnotationId(ann._id);
                          setEditingAnnotationId(ann._id);
                        }
                      }}
                      onMouseEnter={() => setHoveredAnnotationId(ann._id)}
                      onMouseLeave={() => setHoveredAnnotationId(null)}
                    />
                    {selectedAnnotationId === ann._id && fingerIcon && (
                      <KonvaImage
                        image={fingerIcon}
                        x={centroid[0] - 16}
                        y={centroid[1] - 16}
                        width={32}
                        height={32}
                        draggable
                        // Optionally handle onDrag events to reposition the entire polygon
                        onDragMove={(e) => {
                          e.cancelBubble = true;
                          // Compute the shift amount
                          const dx = e.target.x() - (centroid[0] - 16);
                          const dy = e.target.y() - (centroid[1] - 16);
                          // Update all coordinates by adding dx and dy
                          const newCoords = flatPoints.map((value, index) =>
                            index % 2 === 0 ? value + dx : value + dy
                          );
                          const updatedAnnotation = {
                            ...ann,
                            coordinates: newCoords,
                          };
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a && a._id === ann._id ? updatedAnnotation : a
                            )
                          );
                        }}
                        onDragEnd={(e) => {
                          e.cancelBubble = true;

                          debouncedUpdateAnnotation({
                            annotationId: ann._id,
                            data: { coordinates: ann.coordinates }, // use updated coordinates
                          });
                        }}
                      />
                    )}
                    {selectedAnnotationId === ann._id &&
                      controlPoints.map((pt, index) => (
                        <Circle
                          key={`polygon-${ann._id}-point-${index}`}
                          x={pt[0]}
                          y={pt[1]}
                          radius={10}
                          fill="transparent"
                          stroke="silver"
                          draggable
                          onDragMove={(e) => {
                            e.cancelBubble = true;
                            // Optimistically update the control point position in local state
                            const newX = e.target.x();
                            const newY = e.target.y();
                            const newControlPoints = controlPoints.map(
                              (p, idx) => (idx === index ? [newX, newY] : p)
                            );
                            const newFlatPoints = newControlPoints.reduce(
                              (acc, p) => acc.concat(p),
                              []
                            );
                            // Update local state immediately.
                            const optimisticAnnotation = {
                              ...ann,
                              coordinates: newFlatPoints,
                            };
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a && a._id === ann._id
                                  ? optimisticAnnotation
                                  : a
                              )
                            );
                            // (Optionally, you could also update on every drag move if desired.)
                          }}
                          onDragEnd={(e) => {
                            e.cancelBubble = true;
                            const newX = e.target.x();
                            const newY = e.target.y();
                            const newControlPoints = controlPoints.map(
                              (p, idx) => (idx === index ? [newX, newY] : p)
                            );
                            const newFlatPoints = newControlPoints.reduce(
                              (acc, p) => acc.concat(p),
                              []
                            );

                            // Create the updated annotation.
                            const updatedAnnotation = {
                              ...ann,
                              coordinates: newFlatPoints,
                            };

                            // Optimistically update local state.
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a && a._id === ann._id ? updatedAnnotation : a
                              )
                            );

                            // Call the debounced update (PATCH call) so that multiple rapid changes are debounced.
                            debouncedUpdateAnnotation({
                              annotationId: ann._id,
                              data: { coordinates: newFlatPoints },
                            });
                          }}
                          onMouseEnter={() => setHoveredPointIndex(index)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        />
                      ))}
                  </React.Fragment>
                );
              }

              return null;
            })}
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
