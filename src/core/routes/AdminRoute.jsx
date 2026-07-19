import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { doLogoutSuccess } from '../../modules/identity/redux/authAction';
import { getAdminSession } from '../../modules/admin/services/adminAuthService';

const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, account, token } = useSelector((state) => state.identity);
  const [verification, setVerification] = useState('checking');

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !token || account?.role !== 'ADMIN') {
      setVerification('skipped');
      return () => { active = false; };
    }

    setVerification('checking');
    getAdminSession()
      .then((response) => {
        if (active) setVerification(response?.EC === 0 ? 'verified' : 'failed');
      })
      .catch(() => {
        if (!active) return;
        dispatch(doLogoutSuccess());
        setVerification('failed');
      });
    return () => { active = false; };
  }, [account?.role, dispatch, isAuthenticated, token]);

  if (!isAuthenticated || !token) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (account?.role !== 'ADMIN') {
    const participantRoute = account?.role === 'CUSTOMER'
      ? '/customer/dashboard'
      : account?.role === 'HANDYMAN' ? '/handyman/dashboard' : '/';
    return <Navigate to={participantRoute} replace />;
  }
  if (verification === 'failed') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (verification !== 'verified') {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center" role="status" aria-label="Verifying administrator session">
        <div className="spinner-border text-warning" />
      </div>
    );
  }
  return children;
};

export default AdminRoute;
