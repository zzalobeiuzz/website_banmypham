import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Nếu chưa login hoặc không phải admin (role !== 1)
  if (!user || user.role !== 1) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
