import React from 'react';
import { Link } from 'react-router-dom';
import { FaWrench } from 'react-icons/fa';
import '../styles/Header.scss';


const Header = () => {
    return (
        <nav className="navbar navbar-expand-lg custom-header sticky-top">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <div className="brand-icon">
                        <FaWrench />
                    </div>
                    Trusted Handyman
                </Link>
                
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarContent"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <a className="nav-link" href="#how-it-works">How it works</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#features">Features</a>
                        </li>
                    </ul>
                    <div className="d-flex align-items-center mt-3 mt-lg-0 gap-2">
                        <div className="dropdown">
                            <button className="btn btn-link btn-login dropdown-toggle text-decoration-none" type="button" id="loginDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                Log in
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="loginDropdown">
                                <li><Link className="dropdown-item py-2" to="/login?role=CUSTOMER">I am a Customer</Link></li>
                                <li><Link className="dropdown-item py-2" to="/login?role=HANDYMAN">I am a Handyman</Link></li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button className="btn btn-primary btn-signup dropdown-toggle fw-bold" type="button" id="signupDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                Sign Up
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="signupDropdown">
                                <li><Link className="dropdown-item py-2" to="/register?role=CUSTOMER">Join as Customer</Link></li>
                                <li><Link className="dropdown-item py-2" to="/register?role=HANDYMAN">Join as Professional</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;