import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShieldAlt } from 'react-icons/fa';
import axiosInstance from '../../../../../core/api/axiosInstance'; 
import { doLoginSuccess } from '../../../../identity/redux/authAction';
import '../styles/AdminLoginPage.scss';

const AdminLoginPage = () => {
    const [credentials, setCredentials] = useState({ valueLogin: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (!credentials.valueLogin || !credentials.password) {
            toast.error("Please enter email and password");
            return;
        }

        setIsLoading(true);
        try {
            // Tận dụng lại API Login chung
            let res = await axiosInstance.post("/auth/login", credentials);
            
            if (res && res.EC === 0) {
                // Kiểm tra Role ngay lập tức, chặn user thường đăng nhập ở cổng này
                if (res.DT.user.role !== 'ADMIN') {
                    toast.error("Access Denied: You are not an Administrator.");
                    setIsLoading(false);
                    return;
                }

                dispatch(doLoginSuccess(res.DT));
                toast.success("Welcome back, Administrator!");
                navigate('/admin/dashboard');
            } else {
                toast.error(res.EM || "Login failed");
            }
        } catch (error) {
            toast.error("Server error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="login-card">
                <div className="brand">
                    <div className="icon-wrapper"><FaShieldAlt /></div>
                    <h3>System Admin</h3>
                    <p>Secure Portal Authentication</p>
                </div>

                <form onSubmit={handleAdminLogin}>
                    <div className="form-group">
                        <label>Admin Email</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            name="valueLogin"
                            placeholder="admin@thotincay.vn"
                            value={credentials.valueLogin}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            name="password"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={handleInputChange}
                        />
                    </div>
                    <button type="submit" className="btn-login" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;