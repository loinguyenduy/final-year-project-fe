import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShieldAlt } from 'react-icons/fa';
import { doLoginSuccess } from '../../../../identity/redux/authAction';
import { loginAdmin } from '../../../services/adminAuthService';
import '../styles/AdminLoginPage.scss';

const resolveDestination = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/admin/') || value.startsWith('/admin/login')) {
    return '/admin/dashboard';
  }
  return value;
};

const AdminLoginPage = () => {
  const [credentials, setCredentials] = useState({ valueLogin: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    if (!credentials.valueLogin.trim() || !credentials.password) {
      toast.error('Please enter your administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginAdmin({
        valueLogin: credentials.valueLogin.trim(),
        password: credentials.password
      });
      if (response?.EC !== 0) throw response;
      dispatch(doLoginSuccess(response.DT));
      toast.success('Welcome back, Administrator.');
      navigate(resolveDestination(location.state?.from), { replace: true });
    } catch (error) {
      toast.error(error?.EM || 'Unable to sign in to the Admin Portal.');
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
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              className="form-control"
              name="valueLogin"
              autoComplete="username"
              value={credentials.valueLogin}
              onChange={(event) => setCredentials((current) => ({ ...current, valueLogin: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-control"
              name="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
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
