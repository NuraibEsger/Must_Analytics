import React, { useState } from "react";

const LazyImage = ({ src, alt, width = "100%", height = "200px" }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: loaded ? "transparent" : "#f0f0f0", // Placeholder color before load
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          position: "absolute",
        }}
        onLoad={() => {
          setLoaded(true);
        }}
      />
    </div>
  );
};

export default LazyImage;
