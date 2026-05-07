import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { resendVerifyEmailApi } from '../../services/authService';
import { FaEnvelopeOpenText } from 'react-icons/fa'; // Icon phong bì

const CheckEmailPage = () => {
    const location = useLocation();
    // Lấy email được truyền từ trang Register sang (nếu có)
    const email = location.state?.email || "your email"; 
    
    const [isLoading, setIsLoading] = useState(false);

    const handleResendEmail = async () => {
        if (email === "your email") {
            toast.error("Không tìm thấy email. Vui lòng đăng nhập lại.");
            return;
        }

        setIsLoading(true);
        try {
            let res = await resendVerifyEmailApi(email);
            if (res && res.EC === 0) {
                toast.success("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi lại email.");
        }
        setIsLoading(false);
    };

    return (
        <AuthLayout>
            <div className="text-center">
                <div 
                    style={{
                        backgroundColor: '#e0f2fe',
                        color: '#0d6efd',
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px',
                        margin: '0 auto 1.5rem auto'
                    }}
                >
                    <FaEnvelopeOpenText />
                </div>
                
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                    Check your email
                </h3>
                
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
                    We sent a verification link to <br />
                    <strong style={{ color: '#1e293b' }}>{email}</strong>
                </p>

                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '1.5rem', marginBottom: '2rem' }}>
                    Click the link in the email to verify your account. If you don't see it, be sure to check your spam folder.
                </p>

                <button 
                    onClick={handleResendEmail} 
                    className="btn w-100 mb-3" 
                    style={{ border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 500 }}
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Resend verification email"}
                </button>

                <div style={{ fontSize: '14px' }}>
                    <Link to="/register" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
                        &larr; Back to sign up
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default CheckEmailPage;