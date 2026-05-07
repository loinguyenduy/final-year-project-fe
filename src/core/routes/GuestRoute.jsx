import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const GuestRoute = ({ children }) => {
  const { isAuthenticated, account } = useSelector((state) => state.identity);

  if (isAuthenticated) {
    // Tự động đá về trang chủ hoặc dashboard tương ứng với Role
    if (account?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (account?.role === 'HANDYMAN') {
      return <Navigate to="/handyman/dashboard" replace />; 
    }
    
    // CUSTOMER thì về trang chủ
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default GuestRoute;