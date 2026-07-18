import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { doLoginSuccess } from '../../../redux/authAction';
import '../styles/Auth.scss';
import {loginUserApi} from '../../../services/authService'

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault(); 

        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        try {
            let res = await loginUserApi(email, password);
            
            if (res && res.EC === 0) {
                dispatch(doLoginSuccess(res.DT));
                
                if (!res.DT.user.is_email_verified) {
                    toast.warning("Account not verified. Please check your email!");
                } else {
                    toast.success("Login successful!");
                    const userRole = res.DT.user.role?.toUpperCase();
                    const from = location.state?.from;
                    const requestedPath = from?.pathname
                        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
                        : null;

                    if (requestedPath) {
                        navigate(requestedPath, { replace: true });
                    } else if (userRole === 'CUSTOMER') {
                        navigate('/customer/dashboard', { replace: true });
                    } else if (userRole === 'HANDYMAN') {
                        navigate('/handyman/dashboard', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }
                }
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error(error?.EM || "Invalid login information.");
        }
        setIsLoading(false);
    };

    const handleSocialLogin = (provider) => {
        window.location.href = `http://localhost:5000/api/v1/auth/${provider}`;
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h3 className="auth-title">Log in to your account</h3>
                <p className="auth-subtitle">Enter your email and password to continue</p>
            </div>

            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="form-label custom-label">Email</label>
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
                        <label className="form-label custom-label">Password</label>
                        <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
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
                        <span className="icon-google">G</span> Google
                    </button>
                </div>
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
                        <span className="icon-facebook">f</span> Facebook
                    </button>
                </div>
            </div>

            <div className="auth-footer">
                Don't have an account? <Link to="/register" className="auth-footer-link">Sign up now</Link>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
