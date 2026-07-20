import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaBars,
  FaBell,
  FaFolderOpen,
  FaGavel,
  FaHome,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaUserCheck,
  FaWallet,
  FaWrench
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { doLogoutSuccess } from '../../identity/redux/authAction';
import { logoutAdmin } from '../services/adminAuthService';
import useAdminQueueCounts from '../hooks/useAdminQueueCounts';
import './AdminLayout.scss';

const MENU_ITEMS = [
  { path: '/admin/dashboard', icon: FaHome, title: 'Dashboard' },
  { path: '/admin/kyc', icon: FaUserCheck, title: 'KYC Management', queue: 'kyc_pending' },
  { path: '/admin/reviews', icon: FaGavel, title: 'Review Center', queue: 'review_pending_total' },
  { icon: FaWallet, title: 'Finance', disabled: true },
  { icon: FaFolderOpen, title: 'Evidence Vault', disabled: true }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { account } = useSelector((state) => state.identity);
  const { counts, isLoading: countsLoading, refresh: refreshQueueCounts } = useAdminQueueCounts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const adminName = account?.full_name || 'System Admin';
  const initials = useMemo(() => adminName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), [adminName]);

  useEffect(() => {
    setDrawerOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    const handleKey = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setDrawerOpen(false);
    setLoggingOut(true);
    let serverFailed = false;
    try {
      await logoutAdmin();
    } catch {
      serverFailed = true;
    } finally {
      dispatch(doLogoutSuccess());
      navigate('/admin/login', { replace: true });
      toast[serverFailed ? 'warning' : 'success'](
        serverFailed
          ? 'Local session cleared. The server session could not be revoked.'
          : 'Administrator session ended.'
      );
    }
  };

  const currentTitle = MENU_ITEMS.find((item) => item.path && location.pathname.startsWith(item.path))?.title || 'Admin Portal';
  const pendingCount = counts.kyc_pending;
  const reviewCount = counts.review_pending_total;
  const allPendingCount = Number(pendingCount || 0) + Number(reviewCount || 0);

  return (
    <div className="admin-layout-wrapper">
      {drawerOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
      <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`} aria-label="Administrator navigation">
        <div className="sidebar-header">
          <div className="logo-icon"><FaWrench /></div>
          <div className="logo-text"><h4>The Trusted Handyman</h4><small>Admin Portal</small></div>
          <button className="close-sidebar" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}><FaTimes /></button>
        </div>
        <div className="admin-info">
          <div className="avatar">{initials}</div>
          <div className="details"><h6>{adminName}</h6><small><FaShieldAlt /> Administrator</small></div>
        </div>
        <nav className="nav-menu">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <button key={item.title} type="button" className="nav-item disabled" disabled>
                  <span className="nav-left"><Icon /><span>{item.title}</span></span>
                  <span className="coming-soon">Coming soon</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-left"><Icon /><span>{item.title}</span></span>
                {item.queue && counts[item.queue] > 0 && <span className="queue-badge">{counts[item.queue] > 99 ? '99+' : counts[item.queue]}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
            <FaSignOutAlt /> {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-heading">
            <button className="menu-toggle" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}><FaBars /></button>
            <h1>{currentTitle}</h1>
          </div>
          <div className="header-actions">
            <div className="admin-notification-menu">
              <button
                className="notification-button"
                aria-label={`${allPendingCount} pending administrator reviews`}
                aria-expanded={notificationOpen}
                onClick={() => setNotificationOpen((value) => !value)}
              >
                <FaBell />
                {!countsLoading && allPendingCount > 0 && <span>{allPendingCount > 99 ? '99+' : allPendingCount}</span>}
              </button>
              {notificationOpen && <div className="notification-popover">
                <button onClick={() => navigate('/admin/kyc')}><span>KYC requests</span><strong>{pendingCount || 0}</strong></button>
                <button onClick={() => navigate('/admin/reviews')}><span>Review Center</span><strong>{reviewCount || 0}</strong></button>
              </div>}
            </div>
            <div className="user-circle" aria-label={adminName}>{initials}</div>
          </div>
        </header>
        <section className="admin-content">
          <Outlet context={{ queueCounts: counts, refreshQueueCounts }} />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
