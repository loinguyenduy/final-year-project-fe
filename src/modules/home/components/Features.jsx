import React from 'react';
import { FaStar, FaLock, FaShieldAlt } from 'react-icons/fa';
import '../styles/Features.scss';

const Features = () => {
    return (
        <section className="features-section" id="features">
            <div className="container">
                <div className="row gy-5 align-items-center">
                    <div className="col-lg-6 pr-lg-5">
                        <div className="feature-content">
                            <h2>A system designed to protect everyone</h2>
                            <p className="lead-text">
                                We solve the crisis of trust in the handyman industry using Fintech and AI, 
                                ensuring both customers and professionals are protected.
                            </p>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaStar />
                                </div>
                                <div>
                                    <h5>Bayesian Reputation Score</h5>
                                    <p>Prevents score manipulation by new accounts. Emphasizes job completion rate over just star ratings.</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaLock />
                                </div>
                                <div>
                                    <h5>100% Escrow Payments</h5>
                                    <p>Funds are held securely by the platform until the job is completed and confirmed by the customer.</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaShieldAlt />
                                </div>
                                <div>
                                    <h5>Evidence Vault & Warranty</h5>
                                    <p>Immutable photo evidence and digital contracts. 20% of payment is locked for 15 days to ensure service quality.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="floating-card-wrapper">
                            <div className="handyman-card">
                                <div className="profile-row">
                                    <div className="avatar">JD</div>
                                    <div className="info">
                                        <p className="name">John Doe (Electrician)</p>
                                        <p className="score">★ 4.8 Bayesian Score</p>
                                    </div>
                                    <div className="kyc-badge">Level 2 KYC</div>
                                </div>
                                <div className="quote-row">
                                    <span className="label">Estimated Quote</span>
                                    <span className="price">$120.00</span>
                                </div>
                                <div className="escrow-alert">
                                    <FaShieldAlt size={24} />
                                    <div className="alert-text">
                                        <h6>15-Day Warranty Active</h6>
                                        <p>Funds secured in Escrow</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;