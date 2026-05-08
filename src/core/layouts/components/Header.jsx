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
                    <div className="d-flex align-items-center mt-3 mt-lg-0">
                        <Link to="/login" className="btn-login">Log in</Link>
                        <Link to="/register" className="btn btn-primary btn-signup">Sign Up</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;