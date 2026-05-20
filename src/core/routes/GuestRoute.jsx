import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GuestRoute = ({ children }) => {
  const { isAuthenticated, account } = useSelector((state) => state.identity);

  if (isAuthenticated) {
    if (account?.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (account?.role === "HANDYMAN") {
      return <Navigate to="/handyman/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
