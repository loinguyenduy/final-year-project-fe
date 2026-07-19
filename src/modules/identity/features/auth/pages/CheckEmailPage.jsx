import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { resendVerifyEmailApi } from '../../../services/authService';
import { FaEnvelopeOpenText } from 'react-icons/fa'; 
import '../styles/CheckEmail.scss';

const CheckEmailPage = () => {
    const location = useLocation();
    const email = location.state?.email || "your email"; 
    
    const [isLoading, setIsLoading] = useState(false);

    const handleResendEmail = async () => {
        if (email === "your email") {
            toast.error("Email not found. Please go back and enter your email again.");
            return;
        }

        setIsLoading(true);
        try {
            let res = await resendVerifyEmailApi(email);
            if (res && res.EC === 0) {
                toast.success("Verification email resent. Please check your inbox.");
            } else {
                toast.error(res.EM);
            }
        } catch {
            toast.error("An error occurred while resending the email.");
        }
        setIsLoading(false);
    };

    return (
        <AuthLayout>
            <div className="text-center">
                <div className="mail-icon-wrapper">
                    <FaEnvelopeOpenText />
                </div>
                
                <h3 className="check-mail-title">
                    Check your email
                </h3>
                
                <p className="email-sent-text">
                    We sent a verification link to <br />
                    <strong className="email-highlight">{email}</strong>
                </p>

                <p className="instruction-text">
                    Click the link in the email to verify your account. If you don't see it, be sure to check your spam folder.
                </p>

                <button 
                    onClick={handleResendEmail} 
                    className="btn btn-resend w-100 mb-3" 
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Resend verification email"}
                </button>

                <div className="back-link-wrapper">
                    <Link to="/register" className="back-link">
                        &larr; Back to sign up
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default CheckEmailPage;
