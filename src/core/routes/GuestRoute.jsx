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
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
