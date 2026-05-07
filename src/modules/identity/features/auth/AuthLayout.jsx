import React from 'react';
import './Auth.scss';
import { FaWrench } from 'react-icons/fa'; 

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-header">
        <div className="brand-icon">
          <FaWrench />
        </div>
        <h1>Trusted Handyman</h1>
        <p>Fast, reliable, and transparent</p>
      </div>

      <div className="auth-card">
        {/* Nội dung trang Login, Register, Verify sẽ được nhét vào đây */}
        {children} 
      </div>
    </div>
  );
};

export default AuthLayout;