import React from "react";

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded mb-2">
      {message}
    </div>
  );
};

export default ErrorMessage;