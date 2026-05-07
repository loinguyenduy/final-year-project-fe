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
            setMessage('Token không hợp lệ hoặc bị thiếu.');
            return;
        }

        const verifyToken = async () => {
            try {
                let res = await verifyEmailApi(token);
                if (res && res.EC === 0) {
                    setStatus('success');
                    setMessage('Tài khoản của bạn đã được xác thực thành công!');
                } else {
                    setStatus('error');
                    setMessage(res.EM || 'Xác thực thất bại. Token có thể đã hết hạn.');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error?.EM || 'Lỗi kết nối đến máy chủ.');
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
                        <h4>Đang xác thực...</h4>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <FaCheckCircle style={{ fontSize: '50px', color: '#198754', marginBottom: '1rem' }} />
                        <h4 style={{ color: '#198754', fontWeight: 'bold' }}>Thành công!</h4>
                        <p style={{ color: '#64748b' }}>{message}</p>
                        <button className="btn btn-primary w-100 mt-3" onClick={() => navigate('/login')}>
                            Đi tới Đăng nhập
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <FaTimesCircle style={{ fontSize: '50px', color: '#dc3545', marginBottom: '1rem' }} />
                        <h4 style={{ color: '#dc3545', fontWeight: 'bold' }}>Xác thực thất bại</h4>
                        <p style={{ color: '#64748b' }}>{message}</p>
                        <button className="btn btn-outline-secondary w-100 mt-3" onClick={() => navigate('/login')}>
                            Quay lại Đăng nhập
                        </button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
};

export default VerifyEmailProcess;