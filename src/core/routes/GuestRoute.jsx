import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GuestRoute = ({ children }) => {
  const { isAuthenticated, account } = useSelector((state) => state.identity);

  if (isAuthenticated) {
    const role = account?.role?.toUpperCase();
    if (role === "CUSTOMER") {
      return <Navigate to="/customer/dashboard" replace />;
    }
    if (role === "HANDYMAN") {
      return <Navigate to="/handyman/dashboard" replace />;
    }
    if (role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
