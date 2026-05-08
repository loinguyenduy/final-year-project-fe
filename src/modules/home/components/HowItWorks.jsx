import React from 'react';
import { FaSearch, FaBolt, FaLock, FaShieldAlt } from 'react-icons/fa';
import '../styles/HowItWorks.scss';

const HowItWorks = () => {
    return (
        <section className="how-it-works-section" id="how-it-works">
            <div className="container">
                <div className="section-header">
                    <h2>How it works</h2>
                    <p>We've simplified the process of finding and hiring trustworthy professionals for your home needs.</p>
                </div>

                <div className="row gy-4">
                    <div className="col-lg-3 col-md-6">
                        <div className="step-card">
                            <div className="icon-wrapper">
                                <FaSearch />
                            </div>
                            <h4>1. Diagnose & Post</h4>
                            <p>Chat with our AI assistant to diagnose the issue, get a price estimate, and post your job securely without exposing your phone number.</p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="step-card">
                            <div className="icon-wrapper">
                                <FaBolt />
                            </div>
                            <h4>2. Review Quotes</h4>
                            <p>Receive competitive bids from professionals. Compare them based on their Bayesian Trust Score, price, and KYC verification level.</p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="step-card">
                            <div className="icon-wrapper">
                                <FaLock />
                            </div>
                            <h4>3. Secure Commitment</h4>
                            <p>Select a pro and lock in your commitment with a small deposit. Track their arrival via GPS and approve the final on-site quote.</p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="step-card">
                            <div className="icon-wrapper">
                                <FaShieldAlt />
                            </div>
                            <h4>4. Execution & Warranty</h4>
                            <p>Pay securely via Escrow. The pro uploads proof before & after work. Enjoy a 15-day automated warranty and rate the service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;