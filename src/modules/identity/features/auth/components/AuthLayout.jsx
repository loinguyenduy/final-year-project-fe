import React from 'react';
import '../styles/Auth.scss'; 
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
        {children} 
      </div>
    </div>
  );
};

export default AuthLayout;