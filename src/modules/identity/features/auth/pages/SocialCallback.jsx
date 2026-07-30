import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { doLoginSuccess } from '../../../redux/authAction';
import { jwtDecode } from "jwt-decode";

const SocialCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            toast.error("Social login failed. Please try again.");
            navigate('/login');
            return;
        }

        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                
                const payload = {
                    access_token: token,
                    user: decodedUser
                };

                dispatch(doLoginSuccess(payload));
                toast.success("Login successful!");
                
                const userRole = decodedUser.role?.toUpperCase();
                if (userRole === 'CUSTOMER') {
                    navigate('/customer/dashboard');
                } else {
                    navigate('/');
                }
            } catch {
                toast.error("Invalid token received from server.");
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="ms-3">Authenticating...</h4>
        </div>
    );
};

export default SocialCallback;
