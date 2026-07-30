import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import axios from '../api/axiosInstance';
import {
    doLogoutSuccess,
    doUpdateAccessToken
} from '../../modules/identity/redux/authAction';

const ACCESS_TOKEN_CLOCK_SKEW_MS = 5000;

const hasUsableAccessToken = (token) => {
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        return Number.isFinite(decoded?.exp)
            && decoded.exp * 1000 > Date.now() + ACCESS_TOKEN_CLOCK_SKEW_MS;
    } catch {
        return false;
    }
};

const AuthSessionGate = ({ children }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, token } = useSelector(state => state.identity);
    const [isCheckingSession, setIsCheckingSession] = useState(isAuthenticated);

    useEffect(() => {
        let isMounted = true;

        if (!isAuthenticated || hasUsableAccessToken(token)) {
            setIsCheckingSession(false);
            return () => {
                isMounted = false;
            };
        }

        setIsCheckingSession(true);

        const restoreSession = async () => {
            try {
                const response = await axios.post('/auth/refresh');
                const newAccessToken = response?.DT?.access_token;

                if (response?.EC !== 0 || !hasUsableAccessToken(newAccessToken)) {
                    throw new Error('The refreshed access token is invalid.');
                }

                dispatch(doUpdateAccessToken(newAccessToken));
            } catch {
                dispatch(doLogoutSuccess());
            } finally {
                if (isMounted) setIsCheckingSession(false);
            }
        };

        void restoreSession();

        return () => {
            isMounted = false;
        };
    }, [dispatch, isAuthenticated, token]);

    if (isCheckingSession) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100" role="status" aria-label="Restoring session">
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    return children;
};

export default AuthSessionGate;
