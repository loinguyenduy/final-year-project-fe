import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    FaHome, FaUserCheck, FaGavel, FaWallet, FaFolderOpen, 
    FaSignOutAlt, FaBell, FaWrench, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
// Import action logout của bạn (điều chỉnh đường dẫn nếu cần)
import { doLogoutSuccess } from '../../identity/redux/authAction'; 
import './AdminLayout.scss';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    
    // Lấy thông tin Admin từ Redux
    const { account } = useSelector(state => state.identity);
    const adminName = account?.full_name || 'System Admin';
    const initials = adminName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Mảng cấu hình Sidebar Menu (Rất dễ mở rộng)
    const menuItems = [
        { path: '/admin/dashboard', icon: <FaHome size={18}/>, title: 'Dashboard' },
        { path: '/admin/kyc', icon: <FaUserCheck size={18}/>, title: 'KYC Management', badge: 5 },
        { path: '/admin/disputes', icon: <FaGavel size={18}/>, title: 'Disputes', badge: 3 },
        { path: '/admin/finance', icon: <FaWallet size={18}/>, title: 'Finance' },
        { path: '/admin/evidence', icon: <FaFolderOpen size={18}/>, title: 'Evidence Vault' },
    ];
    const handleLogout = () => {
        dispatch(doLogoutSuccess());
        toast.success("Logout successful!");
        navigate('/login');
    };

    // Helper: Lấy title cho Header dựa trên route hiện tại
    const getHeaderTitle = () => {
        const currentMenu = menuItems.find(item => location.pathname.includes(item.path));
        return currentMenu ? currentMenu.title : 'Admin Portal';
    };

    return (
        <div className="admin-layout-wrapper">
            {/* SIDEBAR TRÁI */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon"><FaWrench /></div>
                    <div className="logo-text">
                        <h4>The Trusted Handyman</h4>
                        <small>Admin Portal</small>
                    </div>
                </div>

                <div className="admin-info">
                    <div className="avatar">{initials}</div>
                    <div className="details">
                        <h6>{adminName}</h6>
                        <small><FaShieldAlt className="text-warning"/> Administrator</small>
                    </div>
                </div>

                <nav className="nav-menu">
                    {menuItems.map((item, index) => (
                        <NavLink 
                            key={index} 
                            to={item.path} 
                            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        >
                            <div className="nav-left">
                                <span className="icon">{item.icon}</span>
                                <span>{item.title}</span>
                            </div>
                            {item.badge && <span className="badge">{item.badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt size={18}/> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT PHẢI */}
            <main className="admin-main">
                {/* Header ngang */}
                <header className="admin-header">
                    <h5 className="header-title">{getHeaderTitle()}</h5>
                    
                    <div className="header-actions">
                        <div className="icon-btn">
                            <FaBell size={20} />
                            <span className="notify-dot">3</span>
                        </div>
                        <div className="user-circle">AD</div>
                    </div>
                </header>

                {/* Khu vực render nội dung các trang con (Dashboard, KYC...) */}
                <section className="admin-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
};

export default AdminLayout;