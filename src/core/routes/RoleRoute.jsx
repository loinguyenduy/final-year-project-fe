import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const RoleRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, account } = useSelector(state => state.identity);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (account && !allowedRoles.includes(account.role)) {
        toast.error("You do not have permission to access this page.");
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleRoute;