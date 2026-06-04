import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
    FaAward, FaStar, FaShieldAlt, FaUserEdit, 
    FaRegUser, FaMapMarkerAlt, FaFileAlt, FaCheck, FaTimes, FaClock 
} from 'react-icons/fa';
import moment from 'moment';
import '../styles/HandymanProfile.scss';

const HandymanProfilePage = () => {
    // --- LẤY DỮ LIỆU THẬT TỪ REDUX (KẾT QUẢ CỦA GETDETAILEDPROFILESERVICE) ---
    const { account } = useSelector(state => state.identity);
    const profile = account?.handyman_profile || {};
    const wallets = account?.wallets || [];
    const authProviders = account?.auth_providers || []; // Mảng chứa các Provider Google/Facebook liên kết
    const kycRequests = account?.kyc_requests || []; // Mảng danh sách các file cấu trúc KycRequest model

    const [activeTab, setActiveTab] = useState(0);

    // --- MAPPING REAL DATA ---
    const fullName = account?.full_name || 'N/A';
    const email = account?.email || 'N/A';
    const phone = account?.phone_number || 'Not updated';
    const level = profile.handyman_level || 'C1';
    const bayesianScore = parseFloat(profile.bayesian_score || 5.0).toFixed(1);
    const totalJobs = profile.total_jobs_completed || 0;
    const isBondPaid = profile.security_bond_status === 'PAID';

    // Đọc số dư thật của ví Ký Quỹ
    const escrowWalletBalance = wallets.find(w => w.wallet_type === 'HANDYMAN_ESCROW')?.balance || 0;

    // Check trạng thái liên kết Google & Facebook từ mảng auth_providers thật
    const isGoogleLinked = authProviders.some(p => p.provider?.toUpperCase() === 'GOOGLE');
    const isFacebookLinked = authProviders.some(p => p.provider?.toUpperCase() === 'FACEBOOK');

    const userInitials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // --- MOCK DATA (Cho các trường chưa hỗ trợ database) ---
    const mockData = {
        experience: '2 Years',
        completionRate: '98.6%',
        bio: 'Professional handyman with expertise in household appliances, electrical repairs, and cooling systems. Certified specialist with 5 years of practical fieldwork.',
        skills: ['Appliance Repair', 'Electrical Systems', 'Plumbing Maintenance', 'HVAC Service'],
        areas: ['District 1', 'District 3', 'District 10', 'Tan Binh Dist', 'Binh Thanh Dist']
    };

    // --- RENDER DỰA TRÊN MẢNG MODEL KYC_REQUEST THẬT ---
    const renderSecurityAndDocsTab = () => {
        return (
            <>
                {/* Khối quản lý bảo mật & Liên kết mạng xã hội thật */}
                <div className="content-card">
                    <h6>Account Security</h6>
                    <div className="security-row">
                        <span>Google Authentication</span>
                        <span className={`provider-status ${isGoogleLinked ? 'linked' : 'unlinked'}`}>
                            {isGoogleLinked ? 'Linked' : 'Not Linked'}
                        </span>
                    </div>
                    <div className="security-row">
                        <span>Facebook Authentication</span>
                        <span className={`provider-status ${isFacebookLinked ? 'linked' : 'unlinked'}`}>
                            {isFacebookLinked ? 'Linked' : 'Not Linked'}
                        </span>
                    </div>
                    <div className="security-row">
                        <span>Password Management</span>
                        <button className="btn btn-sm btn-link text-danger fw-bold text-decoration-none p-0">Change Password</button>
                    </div>
                </div>

                {/* Khối bóc tách mảng tài liệu thật dựa trên model KYC_Request */}
                <div className="content-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="m-0">Uploaded Documents (KYC Records)</h6>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                            {kycRequests.length} File(s)
                        </span>
                    </div>
                    
                    {kycRequests.length > 0 ? (
                        <div className="doc-list">
                            {kycRequests.map((doc) => (
                                <div className={`doc-item status-${doc.status}`} key={doc.id}>
                                    <div>
                                        <div className="doc-name">
                                            <FaFileAlt /> {doc.document_type?.replace('_', ' ')}
                                        </div>
                                        <div className="doc-date">
                                            {doc.status === 'APPROVED' && doc.reviewed_at 
                                                ? `Approved on: ${moment(doc.reviewed_at).format('DD/MM/YYYY HH:mm')}`
                                                : `Submitted: ${moment(doc.createdAt).format('DD/MM/YYYY')}`}
                                        </div>
                                    </div>
                                    <div className="status">
                                        {doc.status === 'APPROVED' && <FaCheck className="me-1" />}
                                        {doc.status === 'PENDING' && <FaClock className="me-1" />}
                                        {doc.status === 'REJECTED' && <FaTimes className="me-1" />}
                                        {doc.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 text-muted border rounded border-dashed">
                            No documents uploaded yet. Please fulfill KYC criteria.
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="handyman-profile-page">
            <div className="page-header">
                <div>
                    <h3>Profile & KYC</h3>
                    <p>Professional identity, credentials and authentication scope</p>
                </div>
                <button className="btn btn-light fw-bold border shadow-sm">
                    <FaUserEdit className="me-2"/>Edit Profile
                </button>
            </div>

            <div className="row g-4">
                {/* --- CỘT TRÁI (SIDEBAR) --- */}
                <div className="col-lg-4">
                    <div className="profile-sidebar">
                        <div className="avatar-wrapper">
                            {userInitials}
                            <div className="badge-icon"><FaAward /></div>
                        </div>
                        <h4>{fullName}</h4>
                        <div className="subtitle">Official Partner • Active Member</div>

                        <div className="level-badge">
                            <FaShieldAlt className="me-2"/>KYC Level {level.replace('C', '')}
                        </div>

                        <div className="rating-box">
                            <div className="title">Bayesian Reputation Score</div>
                            <div className="stars">
                                <FaStar/><FaStar/><FaStar/><FaStar/><FaStar className="opacity-50"/>
                            </div>
                            <div className="score">{bayesianScore}</div>
                            <small>Anti-manipulation Algorithm</small>
                        </div>

                        <div className="stats-row">
                            <div className="stat"><strong>{totalJobs}</strong><span>Jobs Done</span></div>
                            <div className="stat"><strong>{mockData.completionRate}</strong><span>Success</span></div>
                            <div className="stat"><strong>{mockData.experience}</strong><span>Exp</span></div>
                        </div>

                        {/* HIỂN THỊ SỐ DƯ REAL DATA VÀ BIẾN ĐỔI THEO TRẠNG THÁI VÍ HỆ THỐNG */}
                        <div className={`bond-status ${isBondPaid ? 'active-bond' : ''}`}>
                            <div className="label">Security Escrow Bond</div>
                            <div className="amount-row">
                                <strong>{formatCurrency(escrowWalletBalance)}</strong>
                                {isBondPaid ? (
                                    <span className="badge-paid"><FaCheck className="me-1"/>Bonded</span>
                                ) : (
                                    <span className="badge-unpaid">Unbonded</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI (TABS CONTROL) --- */}
                <div className="col-lg-8">
                    <div className="profile-content">
                        <div className="custom-tabs">
                            <button className={`tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
                                <FaAward className="me-2"/>Overview
                            </button>
                            <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
                                <FaRegUser className="me-2"/>Personal Details
                            </button>
                            <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
                                <FaShieldAlt className="me-2"/>Security & Docs
                            </button>
                        </div>

                        {/* TAB OVERVIEW */}
                        {activeTab === 0 && (
                            <div className="content-card">
                                <h6>Expertise & Skills</h6>
                                <div className="tags-list">
                                    {mockData.skills.map((skill, index) => <span key={index} className="tag">{skill}</span>)}
                                </div>
                                <h6 className="mt-4">About Me</h6>
                                <p className="text-muted" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{mockData.bio}</p>
                            </div>
                        )}

                        {/* TAB DETAILS */}
                        {activeTab === 1 && (
                            <div className="content-card">
                                <h6>Contact Information</h6>
                                <div className="info-grid">
                                    <div className="info-item"><div className="label">Full Name</div><div className="value">{fullName}</div></div>
                                    <div className="info-item"><div className="label">Email Address</div><div className="value">{email}</div></div>
                                    <div className="info-item"><div className="label">Phone Number</div><div className="value">{phone}</div></div>
                                    <div className="info-item"><div className="label">Primary Location</div><div className="value text-muted">Hanoi, Vietnam</div></div>
                                </div>
                                <h6 className="mt-4"><FaMapMarkerAlt className="text-danger me-2"/>Preferred Service Zones</h6>
                                <div className="tags-list">
                                    {mockData.areas.map((area, index) => <span key={index} className="tag"><FaMapMarkerAlt className="me-1"/>{area}</span>)}
                                </div>
                            </div>
                        )}

                        {/* TAB SECURITY & DOCUMENTS (REAL DATA CHẠY THEO MODEL ĐÃ FIX) */}
                        {activeTab === 2 && renderSecurityAndDocsTab()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HandymanProfilePage;