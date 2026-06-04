import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const PaymentResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Lấy thông tin user từ Redux để biết họ là CUSTOMER hay HANDYMAN
    const { account } = useSelector(state => state.identity);
    
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        let success = false;

        // Check VNPay
        const vnpResponseCode = queryParams.get('vnp_ResponseCode');
        if (vnpResponseCode) {
            success = vnpResponseCode === '00';
        } else {
            // Check PayOS
            const cancelParam = queryParams.get('cancel');
            if (location.pathname === '/payment-success' || cancelParam === 'false') {
                success = true;
            } else if (location.pathname === '/payment-cancel' || cancelParam === 'true') {
                success = false;
            }
        }

        setIsSuccess(success);

        // Redirect after countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    
                    // LUỒNG ĐIỀU HƯỚNG DỰA TRÊN ROLE
                    const role = account?.role?.toUpperCase();
                    if (role === 'HANDYMAN') {
                        navigate('/handyman/wallet');
                    } else {
                        navigate('/customer/wallet'); // Fallback mặc định về customer
                    }
                    
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [location, navigate, account]);

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <div className="text-center p-5 bg-white rounded shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
                {isSuccess ? (
                    <FaCheckCircle className="text-success mb-3" style={{ fontSize: '64px' }} />
                ) : (
                    <FaTimesCircle className="text-danger mb-3" style={{ fontSize: '64px' }} />
                )}
                
                <h3 className="fw-bold mb-2">
                    {isSuccess ? 'Payment Successful' : 'Payment Failed / Cancelled'}
                </h3>
                
                <p className="text-muted mb-4">
                    {isSuccess 
                        ? 'Your wallet balance has been updated.' 
                        : 'The transaction was not completed.'}
                </p>
                
                <p className="small text-secondary m-0">
                    Redirecting back to your wallet in {countdown}s...
                </p>
            </div>
        </div>
    );
};

export default PaymentResultPage;