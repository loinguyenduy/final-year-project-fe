import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaThLarge,
  FaBriefcase,
  FaClipboardList,
  FaWallet,
  FaUserShield,
  FaSignOutAlt,
  FaLock,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "../styles/HandymanLayout.scss";
import useKycStatusRealtime from '../../../../identity/hooks/useKycStatusRealtime';
import useAccountSessionRealtime from '../../../../identity/hooks/useAccountSessionRealtime';
import useParticipantShell from '../../../../identity/hooks/useParticipantShell';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';

const HandymanLayout = () => {
  useKycStatusRealtime();
  useAccountSessionRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const { account } = useSelector((state) => state.identity);
  const isLifecycleWorkspace = /^\/jobs\/[^/]+\/lifecycle$/.test(location.pathname);
  const shell = useParticipantShell();

  // Lấy level hiện tại của thợ (Mặc định C0 nếu chưa có)
  const currentLevel = account?.handyman_profile?.handyman_level || "C0";
  const securityBondStatus = account?.handyman_profile?.security_bond_status || "UNPAID";
  const isOfficialPartner = currentLevel === "C3" && securityBondStatus === "PAID";

  // Bảng quy đổi level ra trọng số để dễ so sánh
  const levelWeights = { C0: 0, C1: 1, C2: 2, C3: 3 };
  const currentWeight = levelWeights[currentLevel];

  // Khai báo menu kèm yêu cầu level tối thiểu (requiredLevel)
  const sideMenu = [
    {
      name: "Overview",
      path: "/handyman/dashboard",
      icon: <FaThLarge />,
      requiredLevel: "C1",
    },
    {
      name: "Find Jobs",
      path: "/handyman/find-jobs",
      icon: <FaBriefcase />,
      requiredLevel: "C3",
      requiresOfficialPartner: true,
    },
    {
      name: "My Jobs",
      path: "/handyman/my-jobs",
      icon: <FaClipboardList />,
      requiredLevel: "C2",
    },
    {
      name: "Dual Wallet",
      path: "/handyman/wallet",
      icon: <FaWallet />,
      requiredLevel: "C2",
    },
    {
      name: "Profile & KYC",
      path: "/handyman/profile",
      icon: <FaUserShield />,
      requiredLevel: "C1",
    },
  ];

  const isMenuLocked = (menu) => menu.requiresOfficialPartner
    ? !isOfficialPartner
    : levelWeights[menu.requiredLevel] > currentWeight;

  const handleNavigation = (menu) => {
    const isLocked = isMenuLocked(menu);
    if (isLocked) {
      toast.warning(
        menu.requiresOfficialPartner && currentWeight >= levelWeights.C2
          ? 'Complete the 2,000,000 VND security bond to become a C3 official partner and unlock new Jobs.'
          : `Complete level ${menu.requiredLevel} requirements to unlock this feature!`,
      );
      return;
    }
    navigate(menu.path);
    shell.closeDrawer();
  };

  return (
    <div className={`handyman-layout ${shell.collapsed ? 'participant-shell--collapsed' : ''} ${shell.drawerOpen ? 'participant-shell--drawer-open' : ''}`}>
      {shell.drawerOpen && <button type="button" className="participant-shell__backdrop" onClick={shell.closeDrawer} aria-label="Close navigation" />}
      {/* SIDEBAR */}
      <aside className="sidebar" aria-label="Handyman navigation">
        <div>
          <div className="brand-header">
            <div className="brand-icon">
              <FaThLarge size={18} />
            </div>
            <h1 className="brand-name">Trusted Handyman</h1>
          </div>

          <div className="mini-profile">
            <ParticipantAvatar name={account?.full_name} src={account?.avatar_url} role="HANDYMAN" />
            <div className="info">
              <h6>{account?.full_name || "Loading..."}</h6>
              <small>Pro Level: {currentLevel}</small>
            </div>
          </div>

          <div className="menu-nav">
            {sideMenu.map((menu, index) => {
              const isActive = location.pathname === menu.path
                || (isLifecycleWorkspace && menu.path === '/handyman/my-jobs');
              const isLocked = isMenuLocked(menu);

              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(menu)}
                  className={`menu-btn ${isActive && !isLocked ? "active" : ""} ${isLocked ? "locked" : ""}`}
                  aria-label={menu.name}
                  title={menu.name}
                >
                  <div className="menu-content">
                    {/* Hiển thị ổ khóa nếu bị khóa */}
                    {isLocked ? <FaLock /> : menu.icon}
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
                : sideMenu.find((m) => m.path === location.pathname)?.name || "Dashboard"}
            </h5>
          </div>
          <div className="user-actions">
            <ParticipantAvatar name={account?.full_name} src={account?.avatar_url} role="HANDYMAN" size="small" />
          </div>
        </div>

        <div className="content-area">
          {location.pathname === '/handyman/find-jobs' && !isOfficialPartner ? (
            <section className="alert alert-warning border-0 shadow-sm" role="status">
              <h4 className="alert-heading">Become an official Handyman partner</h4>
              <p>
                Complete KYC and the 2,000,000 VND security bond to reach Level C3 before finding and receiving new Jobs.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(currentWeight >= levelWeights.C2 ? '/handyman/wallet' : '/handyman/profile')}
              >
                {currentWeight >= levelWeights.C2 ? 'Open security bond wallet' : 'Complete profile & KYC'}
              </button>
            </section>
          ) : <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default HandymanLayout;
