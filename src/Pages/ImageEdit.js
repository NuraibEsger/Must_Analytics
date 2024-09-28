import React, { useEffect, useRef, useState } from "react";
import { MapContainer, ImageOverlay, FeatureGroup, Polygon, Rectangle } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getImageById, saveAnnotations } from "../services/imageService";
import { FiEye, FiTrash, FiBox } from "react-icons/fi";  // Icons for annotation controls

export default function ImageEdit() {
  const { id } = useParams();
  const featureGroupRef = useRef(null);
  const [annotations, setAnnotations] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["Images", id],
    queryFn: () => getImageById(id),
    onSuccess: (data) => {
      if (data?.data?.annotations) {
        setAnnotations(data.data.annotations);  // Load existing annotations
      }
      setIsDataLoaded(true);  // Data has been successfully loaded
    },
  });

  const mutation = useMutation({
    mutationFn: (newAnnotations) => saveAnnotations(id, newAnnotations),
    onSuccess: (data) => {
      console.log("Annotations saved successfully!", data);
    },
    onError: (error) => {
      console.error("Error saving annotations:", error);
    },
  });

  const _onCreated = (e) => {
    const { layerType, layer } = e;
    let newAnnotation;

    if (layerType === "polygon") {
      const coordinates = layer.getLatLngs().map((latLngs) =>
        latLngs.map(({ lat, lng }) => [lat, lng])
      );

      const annotationCount = annotations.filter(ann => ann.name.includes("Shadow tree")).length + 1;
      newAnnotation = { id: Date.now(), name: `Shadow tree ${annotationCount}`, coordinates };
    } else if (layerType === "rectangle") {
      const bounds = layer.getBounds();
      const simplifiedBounds = {
        southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
        northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
      };
      newAnnotation = { id: Date.now(), name: "Bounding Box", bounds: simplifiedBounds };
    }

    const updatedAnnotations = [newAnnotation, ...annotations];
    setAnnotations(updatedAnnotations);
    mutation.mutate(updatedAnnotations);  // Save updated annotations to the backend
  };

  const removeAnnotation = (id) => {
    const updatedAnnotations = annotations.filter((annotation) => annotation.id !== id);
    setAnnotations(updatedAnnotations);
    mutation.mutate(updatedAnnotations);  // Save updated annotations to the backend
  };

  if (isLoading) {
    return <div>Loading image...</div>;
  }

  if (isError) {
    return <div>Error loading image: {error.message}</div>;
  }

  const image = data.data;
  const bounds = [[0, 0], [500, 500]];

  return (
    <div className="flex h-screen w-screen relative">
      {/* Annotations Panel */}
      <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex justify-between">
          Annotations ({annotations.length})
          <button className="text-blue-500 hover:text-blue-700 flex items-center space-x-1">
            <FiBox />
            <span>Add</span>
          </button>
        </h3>
        <ul className="space-y-2">
          {annotations.map((annotation) => (
            <li key={annotation.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
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
        style={{ height: "100%", width: "calc(100vw - 18rem)" }}
        center={[250, 250]}
        zoom={1}
        crs={L.CRS.Simple}
        className="z-0"
      >
        <ImageOverlay url={`http://localhost:3001/${image.filePath}`} bounds={bounds} />

        <FeatureGroup ref={featureGroupRef}>
          {/* Load saved polygons */}
          {isDataLoaded && annotations.map((annotation) => {
            if (annotation.coordinates) {
              return (
                <Polygon key={annotation.id} positions={annotation.coordinates} />
              );
            } else if (annotation.bounds) {
              return (
                <Rectangle
                  key={annotation.id}
                  bounds={[
                    annotation.bounds.southWest,
                    annotation.bounds.northEast
                  ]}
                />
              );
            }
            return null;
          })}

          <EditControl
            position="topright"
            onCreated={_onCreated}
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
