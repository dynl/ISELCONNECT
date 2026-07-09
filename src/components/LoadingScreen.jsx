import React from "react";
import "./LoadingScreen.css"; 

function LoadingScreen({ message = "LOADING..." }) {
  return (
    <div className="loading-screen-wrapper page-transition">
      
      {/* The Geometric Bouncing Loader */}
      <div className="loader-shapes">
        <div className="loader-shape"></div>
        <div className="loader-shape"></div>
        <div className="loader-shape"></div>
        <div className="loader-shape"></div>
      </div>
      
      {/* The Loading Text */}
      <h3 
        style={{ 
          color: "#1b0b8c", 
          fontWeight: "900", 
          letterSpacing: "1.5px", 
          margin: 0,
          fontSize: "0.95rem" 
        }}
      >
        {message}
      </h3>
    </div>
  );
}

export default LoadingScreen;