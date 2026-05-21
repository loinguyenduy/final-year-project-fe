import React from 'react';
import { Link } from 'react-router-dom';
import { FaWrench, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/Footer.scss';

const Footer = () => {
    return (
        <footer className="custom-footer">
            <div className="container">
                <div className="row gy-5">
                    <div className="col-lg-4 col-md-12">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div className="brand-icon" style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px', borderRadius: '8px', display: 'inline-flex' }}>
                                <FaWrench size={18} />
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '18px' }}>Trusted Handyman</span>
                        </div>
                        <p className="footer-desc pe-lg-4">
                            The managed marketplace solving the crisis of trust in home services with FinTech and AI.
                        </p>
                    </div>

                    <div className="col-lg-2 col-md-4 col-6">
                        <h5 className="footer-title">Platform</h5>
                        <Link to="#" className="footer-link">How it works</Link>
                        <Link to="#" className="footer-link">Pricing & Fees</Link>
                        <Link to="#" className="footer-link">Supply Store</Link>
                        <Link to="#" className="footer-link">Community Q&A</Link>
                    </div>

                    <div className="col-lg-2 col-md-4 col-6">
                        <h5 className="footer-title">Company</h5>
                        <Link to="#" className="footer-link">About Us</Link>
                        <Link to="#" className="footer-link">Careers</Link>
                        <Link to="#" className="footer-link">Contact Support</Link>
                        <Link to="#" className="footer-link">Trust & Safety</Link>
                    </div>

                    <div className="col-lg-4 col-md-4 col-12">
                        <h5 className="footer-title">Service Coverage</h5>
                        {/* Map placeholder */}
                        <div className="map-container">
                            <div className="text-center">
                                <FaMapMarkerAlt size={24} color="#94a3b8" className="mb-2" />
                                <div>Interactive Map Here</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div>&copy; 2026 Trusted Handyman. All rights reserved.</div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;