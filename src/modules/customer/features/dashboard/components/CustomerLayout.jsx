import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doLogoutSuccess } from '../../../../identity/redux/authAction';
import { FaThLarge, FaRobot, FaBriefcase, FaWallet, FaUserShield, FaSignOutAlt, FaBell } from 'react-icons/fa';
import '../styles/CustomerLayout.scss';

const CustomerLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { account } = useSelector(state => state.identity);
    const isLifecycleWorkspace = /^\/jobs\/[^/]+\/lifecycle$/.test(location.pathname);

    const handleLogout = () => {
        dispatch(doLogoutSuccess());
        navigate('/login');
    };

    // English Menu
    const sideMenu = [
        { name: 'Overview', path: '/customer/dashboard', icon: <FaThLarge /> },
        { name: 'AI Diagnosis', path: '/customer/ai-diagnosis', icon: <FaRobot /> },
        { name: 'My Jobs', path: '/customer/my-jobs', icon: <FaBriefcase />, badge: 2 },
        { name: 'Digital Wallet', path: '/customer/wallet', icon: <FaWallet /> },
        { name: 'Profile & KYC', path: '/customer/profile', icon: <FaUserShield /> },
    ];

    // Extract initials for avatar
    const userInitials = account?.full_name 
        ? account.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
        : 'U';

    return (
        <div className="customer-layout">
            {/* SIDEBAR */}
            <div className="sidebar">
                <div>
                    <div className="brand-header">
                        <div className="brand-icon">
                            <FaThLarge size={18} />
                        </div>
                        <h1 className="brand-name">Trusted Handyman</h1>
                    </div>

                    <div className="mini-profile">
                        <div className="avatar">
                            {account?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="info">
                            <h6>{account?.full_name || 'Loading...'}</h6>
                            <small>{account?.role?.toLowerCase() || 'customer'}</small>
                        </div>
                    </div>

                    <div className="menu-nav">
                        {sideMenu.map((menu, index) => {
                            const isActive = location.pathname === menu.path
                                || (isLifecycleWorkspace && menu.path === '/customer/my-jobs');
                            return (
                                <button 
                                    key={index}
                                    onClick={() => navigate(menu.path)}
                                    className={`menu-btn ${isActive ? 'active' : ''}`}
                                    aria-label={menu.name}
                                    title={menu.name}
                                >
                                    <div className="menu-content">
                                        {menu.icon}
                                        <span>{menu.name}</span>
                                    </div>
                                    {menu.badge && (
                                        <span className={`badge rounded-pill ${isActive ? 'bg-white text-primary' : 'bg-danger text-white'}`}>
                                            {menu.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="logout-section">
                    <button onClick={handleLogout} className="btn-logout" aria-label="Log out" title="Log out">
                        <FaSignOutAlt />
                        <span>Log out</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="main-content">
                <div className="topbar">
                    <h5 className="page-title">
                        {isLifecycleWorkspace
                            ? 'Job Lifecycle'
                            : sideMenu.find(m => m.path === location.pathname)?.name || 'Dashboard'}
                    </h5>
                    <div className="user-actions">
                        <button className="btn-bell" aria-label="Notifications">
                            <FaBell />
                            <span className="badge bg-danger">3</span>
                        </button>
                        <div className="avatar-small">
                            {userInitials}
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default CustomerLayout;
