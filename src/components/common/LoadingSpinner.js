import React from "react";

const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-2">
        <div className={`${sizeClasses[size]} spinner`}></div>
        {text && <p className="text-gray-600 text-sm">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
