import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const RoleRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, account } = useSelector(state => state.identity);

    // 1. Chưa login thì chặn ra cửa
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đã login nhưng Role không nằm trong danh sách cho phép
    if (account && !allowedRoles.includes(account.role)) {
        toast.error("You do not have permission to access this page.");
        return <Navigate to="/" replace />;
    }

    // 3. Hợp lệ thì cho vào
    return children;
};

export default RoleRoute;