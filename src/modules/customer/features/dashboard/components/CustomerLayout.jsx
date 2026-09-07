import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaThLarge, FaRobot, FaBriefcase, FaWallet, FaUserShield, FaSignOutAlt, FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/CustomerLayout.scss';
import useKycStatusRealtime from '../../../../identity/hooks/useKycStatusRealtime';
import useAccountSessionRealtime from '../../../../identity/hooks/useAccountSessionRealtime';
import useParticipantShell from '../../../../identity/hooks/useParticipantShell';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';

const CustomerLayout = () => {
    useKycStatusRealtime();
    useAccountSessionRealtime();
    const navigate = useNavigate();
    const location = useLocation();
    const { account } = useSelector(state => state.identity);
    const isLifecycleWorkspace = /^\/jobs\/[^/]+\/lifecycle$/.test(location.pathname);
    const shell = useParticipantShell();

    // English Menu
    const sideMenu = [
        { name: 'Overview', path: '/customer/dashboard', icon: <FaThLarge /> },
        { name: 'AI Diagnosis', path: '/customer/ai-diagnosis', icon: <FaRobot /> },
        { name: 'My Jobs', path: '/customer/my-jobs', icon: <FaBriefcase /> },
        { name: 'Digital Wallet', path: '/customer/wallet', icon: <FaWallet /> },
        { name: 'Profile & KYC', path: '/customer/profile', icon: <FaUserShield /> },
    ];

    return (
        <div className={`customer-layout ${shell.collapsed ? 'participant-shell--collapsed' : ''} ${shell.drawerOpen ? 'participant-shell--drawer-open' : ''}`}>
            {shell.drawerOpen && <button type="button" className="participant-shell__backdrop" onClick={shell.closeDrawer} aria-label="Close navigation" />}
            {/* SIDEBAR */}
            <aside className="sidebar" aria-label="Customer navigation">
                <div>
                    <div className="brand-header">
                        <div className="brand-icon">
                            <FaThLarge size={18} />
                        </div>
                        <h1 className="brand-name">Trusted Handyman</h1>
                    </div>

                    <div className="mini-profile">
                        <ParticipantAvatar name={account?.full_name} src={account?.avatar_url} role="CUSTOMER" />
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
                                    onClick={() => { navigate(menu.path); shell.closeDrawer(); }}
                                    className={`menu-btn ${isActive ? 'active' : ''}`}
                                    aria-label={menu.name}
                                    title={menu.name}
                                >
                                    <div className="menu-content">
                                        {menu.icon}
                                        <span>{menu.name}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="logout-section">
                    <button onClick={shell.logout} disabled={shell.loggingOut} className="btn-logout" aria-label="Log out" title="Log out">
                        <FaSignOutAlt />
                        <span>{shell.loggingOut ? 'Signing out…' : 'Log out'}</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar__start">
                        <button type="button" className="participant-shell__toggle" onClick={shell.toggleNavigation} aria-label={shell.isMobile ? 'Open navigation' : shell.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                            {shell.isMobile ? <FaBars /> : shell.collapsed ? <FaChevronRight /> : <FaChevronLeft />}
                        </button>
                        <h5 className="page-title">
                            {isLifecycleWorkspace
                                ? 'Job Lifecycle'
                                : sideMenu.find(m => m.path === location.pathname)?.name || 'Dashboard'}
                        </h5>
                    </div>
                    <div className="user-actions">
                        <ParticipantAvatar name={account?.full_name} src={account?.avatar_url} role="CUSTOMER" size="small" />
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
