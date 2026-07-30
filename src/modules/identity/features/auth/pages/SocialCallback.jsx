import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { doLoginSuccess } from '../../../redux/authAction';
import axiosInstance from '../../../../../core/api/axiosInstance';

const SocialCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        let active = true;
        window.history.replaceState(null, document.title, window.location.pathname);

        const restoreSocialSession = async () => {
            try {
                const response = await axiosInstance.post('/auth/refresh');
                if (!active || response?.EC !== 0 || !response?.DT?.access_token || !response?.DT?.user) {
                    throw new Error('Social session could not be restored.');
                }

                dispatch(doLoginSuccess(response.DT));
                toast.success("Login successful!");
                const userRole = response.DT.user.role?.toUpperCase();
                if (userRole === 'CUSTOMER') {
                    navigate('/customer/dashboard', { replace: true });
                } else if (userRole === 'HANDYMAN') {
                    navigate('/handyman/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } catch {
                if (!active) return;
                toast.error("Social login failed. Please try again.");
                navigate('/login', { replace: true });
            }
        };

        void restoreSocialSession();
        return () => {
            active = false;
        };
    }, [navigate, dispatch]);

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
