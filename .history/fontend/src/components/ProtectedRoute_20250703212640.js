import React from "react";
import { Navigate } from "react-router-dom";
import NotFoundPage from "../";

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Nếu chưa login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Nếu có yêu cầu role và không khớp
  if (requiredRole && user.role !== requiredRole) {
    return <NotFoundPage />;
  }

  // Cho phép vào
  return children;
};

export default ProtectedRoute;
