import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { registerUserApi } from '../../services/authService';

const RegisterPage = () => {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!fullName || !email || !password || !confirmPassword) {
            toast.error("Vui lòng điền các trường bắt buộc!");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        setIsLoading(true);
        try {
            let res = await registerUserApi(email, password, fullName, phone);
            
            if (res && res.EC === 0) {
                toast.success("Tạo tài khoản thành công!");
                // Chuyển hướng sang trang thông báo check mail, truyền kèm email qua state
                navigate('/check-email', { state: { email: email } });
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error(error?.EM || "Có lỗi xảy ra từ Server.");
        }
        setIsLoading(false);
    };

    const handleSocialLogin = (provider) => {
        window.location.href = `http://localhost:5000/api/v1/auth/${provider}`;
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
                    Create an account
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                    Enter your information below to register
                </p>
            </div>

            <form onSubmit={handleRegister}>
                <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Full Name</label>
                    <input 
                        type="text" className="form-control" placeholder="John Doe"
                        value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Email</label>
                    <input 
                        type="email" className="form-control" placeholder="name@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Phone (Optional)</label>
                    <input 
                        type="text" className="form-control" placeholder="+1234567890"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                
                <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Password</label>
                    <input 
                        type="password" className="form-control" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>

                <div className="mb-4">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Confirm Password</label>
                    <input 
                        type="password" className="form-control" placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sign up"}
                </button>
            </form>

            <div className="divider">OR SIGN UP WITH</div>

            <div className="row gx-2">
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')}>
                        <span style={{color: '#ea4335', fontWeight: 'bold'}}>G</span> Google
                    </button>
                </div>
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
                        <span style={{color: '#1877f2', fontWeight: 'bold'}}>f</span> Facebook
                    </button>
                </div>
            </div>

            <div className="text-center mt-4" style={{ fontSize: '14px', color: '#64748b' }}>
                Already have an account? <Link to="/login" style={{ fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
            </div>
        </AuthLayout>
    );
};

export default RegisterPage;