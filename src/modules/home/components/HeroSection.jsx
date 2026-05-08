import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCheckCircle } from 'react-icons/fa';
import '../styles/HeroSection.scss';

const HeroSection = () => {
    // Lấy thông tin user để hiển thị nút CTA phù hợp
    const { isAuthenticated, account } = useSelector(state => state.identity);

    return (
        <section className="hero-section">
            <div className="container">
                <div className="badge-pill">
                    <span style={{ marginRight: '6px' }}>●</span> 
                    The Managed Marketplace for Home Services
                </div>
                
                <h1 className="hero-title">
                    Reliable home repairs,<br />
                    <span className="text-highlight">guaranteed.</span>
                </h1>
                
                <p className="hero-subtitle">
                    Connect instantly with verified, highly-rated professionals. Smart AI 
                    diagnosis, transparent bidding, and secure payments with a 15-day warranty.
                </p>

                <div className="cta-group">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/register" className="btn btn-customer">Post a Job Now</Link>
                            <Link to="/register" className="btn btn-handyman">Become a Professional</Link>
                        </>
                    ) : (
                        // Nếu đã login, điều hướng dựa trên role
                        account?.role === 'HANDYMAN' ? (
                            <Link to="/handyman/dashboard" className="btn btn-customer">Find Jobs</Link>
                        ) : account?.role === 'ADMIN' ? (
                            <Link to="/admin/dashboard" className="btn btn-customer">Admin Panel</Link>
                        ) : (
                            <Link to="/dashboard" className="btn btn-customer">Post a New Job</Link>
                        )
                    )}
                </div>

                <div className="trust-badges">
                    <div className="trust-badge-item">
                        <FaCheckCircle /> AI Diagnosis
                    </div>
                    <div className="trust-badge-item">
                        <FaCheckCircle /> Escrow Payments
                    </div>
                    <div className="trust-badge-item">
                        <FaCheckCircle /> KYC Verified
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;