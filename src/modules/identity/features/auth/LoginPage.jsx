import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { loginUserApi } from '../../services/authService';
import { doLoginSuccess } from '../../redux/authAction';

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Vui lòng nhập đầy đủ Email và Mật khẩu!");
            return;
        }

        setIsLoading(true);
        try {
            let res = await loginUserApi(email, password);
            
            if (res && res.EC === 0) {
                // Lưu token và user info vào Redux
                dispatch(doLoginSuccess(res.DT));
                
                // Kiểm tra chưa verify email
                if (!res.DT.user.is_email_verified) {
                     toast.warning("Tài khoản chưa xác thực. Vui lòng kiểm tra email!");
                     // Có thể điều hướng họ ra trang chờ verify (nếu muốn)
                } else {
                     toast.success("Đăng nhập thành công!");
                     navigate('/'); // Hoặc chuyển hướng dựa theo Role giống project cũ
                }
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error(error?.EM || "Thông tin đăng nhập không hợp lệ.");
        }
        setIsLoading(false);
    };

    const handleSocialLogin = (provider) => {
        // Chuyển hướng trực tiếp sang API Backend của bạn
        window.location.href = `http://localhost:5000/api/v1/auth/${provider}`;
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
                    Log in to your account
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                    Enter your email and password to continue
                </p>
            </div>

            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 500, fontSize: '14px' }}>Email</label>
                    <input 
                        type="email" 
                        className="form-control" 
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <label className="form-label mb-0" style={{ fontWeight: 500, fontSize: '14px' }}>Password</label>
                        {/* Tạm thời để link rỗng cho Forgot password */}
                        <Link to="/forgot-password" style={{ fontSize: '14px', textDecoration: 'none' }}>Forgot password?</Link>
                    </div>
                    <input 
                        type="password" 
                        className="form-control mt-2" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log in"}
                </button>
            </form>

            <div className="divider">OR CONTINUE WITH</div>

            <div className="row gx-2">
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')}>
                        {/* Có thể dùng thẻ img logo google, ở đây mình mô phỏng chữ G */}
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
                Don't have an account? <Link to="/register" style={{ fontWeight: 500, textDecoration: 'none' }}>Sign up now</Link>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;