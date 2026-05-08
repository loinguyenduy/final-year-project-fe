import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { verifyEmailApi } from '../../services/authService';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const VerifyEmailProcess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // loading, success, error
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
    }, [token]);

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
                        <FaCheckCircle style={{ fontSize: '50px', color: '#198754', marginBottom: '1rem' }} />
                        <h4 style={{ color: '#198754', fontWeight: 'bold' }}>Success!</h4>
                        <p style={{ color: '#64748b' }}>{message}</p>
                        <button className="btn btn-primary w-100 mt-3" onClick={() => navigate('/login')}>
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <FaTimesCircle style={{ fontSize: '50px', color: '#dc3545', marginBottom: '1rem' }} />
                        <h4 style={{ color: '#dc3545', fontWeight: 'bold' }}>Verification Failed</h4>
                        <p style={{ color: '#64748b' }}>{message}</p>
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