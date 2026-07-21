import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { doLogoutSuccess } from "../../../../identity/redux/authAction";
import {
  FaThLarge,
  FaBriefcase,
  FaClipboardList,
  FaWallet,
  FaUserShield,
  FaSignOutAlt,
  FaBell,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "../styles/HandymanLayout.scss";
import useKycStatusRealtime from '../../../../identity/hooks/useKycStatusRealtime';
import useAccountSessionRealtime from '../../../../identity/hooks/useAccountSessionRealtime';

const HandymanLayout = () => {
  useKycStatusRealtime();
  useAccountSessionRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { account } = useSelector((state) => state.identity);
  const isLifecycleWorkspace = /^\/jobs\/[^/]+\/lifecycle$/.test(location.pathname);

  // Lấy level hiện tại của thợ (Mặc định C0 nếu chưa có)
  const currentLevel = account?.handyman_profile?.handyman_level || "C0";

  // Bảng quy đổi level ra trọng số để dễ so sánh
  const levelWeights = { C0: 0, C1: 1, C2: 2, C3: 3 };
  const currentWeight = levelWeights[currentLevel];

  const handleLogout = () => {
    dispatch(doLogoutSuccess());
    navigate("/login");
  };

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
      requiredLevel: "C2",
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

  const handleNavigation = (menu) => {
    const isLocked = levelWeights[menu.requiredLevel] > currentWeight;
    if (isLocked) {
      toast.warning(
        `Complete level ${menu.requiredLevel} requirements to unlock this feature!`,
      );
      return;
    }
    navigate(menu.path);
  };

  const userInitials = account?.full_name
    ? account.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="handyman-layout">
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
              {account?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="info">
              <h6>{account?.full_name || "Loading..."}</h6>
              <small>Pro Level: {currentLevel}</small>
            </div>
          </div>

          <div className="menu-nav">
            {sideMenu.map((menu, index) => {
              const isActive = location.pathname === menu.path
                || (isLifecycleWorkspace && menu.path === '/handyman/my-jobs');
              const isLocked = levelWeights[menu.requiredLevel] > currentWeight;

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
                  {menu.badge && !isLocked && (
                    <span
                      className={`badge rounded-pill ${isActive ? "bg-white text-orange" : "bg-danger text-white"}`}
                    >
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
              : sideMenu.find((m) => m.path === location.pathname)?.name || "Dashboard"}
          </h5>
          <div className="user-actions">
            <button className="btn-bell" aria-label="Notifications">
              <FaBell />
              <span className="badge bg-danger">3</span>
            </button>
            <div className="avatar-small">{userInitials}</div>
          </div>
        </div>

        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HandymanLayout;
