import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children }) => {
    // Lưu ý: Đổi state.auth thành state.identity theo file rootReducer đã cấu hình
    const { isAuthenticated } = useSelector(state => state.identity);
    const location = useLocation();

    if (!isAuthenticated) {
        toast.warning("Please login to access this page!");
        // Lưu lại đường dẫn hiện tại vào state 'from' để redirect lại sau khi login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;