import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const RoleRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, account } = useSelector(state => state.identity);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (account) {
        const isAllowed = allowedRoles.map(r => r.toUpperCase()).includes(account.role?.toUpperCase());
        if (!isAllowed) {
            toast.error("You do not have permission to access this page.");
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default RoleRoute;
