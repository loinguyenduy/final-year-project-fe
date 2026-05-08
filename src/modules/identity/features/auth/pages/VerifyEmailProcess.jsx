import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { verifyEmailApi } from '../../../services/authService';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../styles/VerifyEmail.scss';

const VerifyEmailProcess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }
        const verifyToken = async () => {
            try {
                let res = await verifyEmailApi(token);
                if (res && res.EC === 0) {
                    setStatus('success');
                    setTimeout(() => navigate('/login'), 3000);
                    setMessage('Your account has been verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(res.EM || 'Verification failed. The token may have expired.');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error?.EM || 'Error connecting to the server.');
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <AuthLayout>
            <div className="text-center py-4">
                {status === 'loading' && (
                    <>
                        <div className="spinner-border text-primary mb-3" role="status"></div>
                        <h4>Verifying...</h4>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <FaCheckCircle className="success-icon" />
                        <h4 className="success-title">Success!</h4>
                        <p className="message-text">{message}</p>
                        <button className="btn btn-primary w-100 mt-3" onClick={() => navigate('/login')}>
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <FaTimesCircle className="error-icon" />
                        <h4 className="error-title">Verification Failed</h4>
                        <p className="message-text">{message}</p>
                        <button className="btn btn-outline-secondary w-100 mt-3" onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
};

export default VerifyEmailProcess;