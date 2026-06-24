import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FaUserShield, FaWrench, FaUser, FaFileAlt, FaEye, FaCheck, FaTimes, FaInbox } from 'react-icons/fa';
import { fetchPendingKyc, reviewKyc } from '../../../services/adminKycService';
import '../styles/KycManagement.scss';

const KycManagementPage = () => {
    const [pendingList, setPendingList] = useState([]);
    const [filterRole, setFilterRole] = useState('ALL'); // 'ALL', 'HANDYMAN', 'CUSTOMER'
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadPendingKyc();
    }, []);

    const loadPendingKyc = async () => {
        try {
            let res = await fetchPendingKyc();
            if (res && res.EC === 0) {
                setPendingList(res.DT);
            } else {
                toast.error(res.EM || "Failed to fetch pending KYC.");
            }
        } catch (error) {
            toast.error("Server error. Could not load data.");
        }
    };

    // Lọc danh sách (Hybrid Filter)
    const filteredList = useMemo(() => {
        if (filterRole === 'ALL') return pendingList;
        return pendingList.filter(user => user.role === filterRole);
    }, [pendingList, filterRole]);

    // Xử lý Approve / Reject
    const handleReviewAction = async (status) => {
        if (!selectedUser) return;
        
        if (status === 'REJECTED' && !rejectReason.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        setIsProcessing(true);
        try {
            const payload = {
                userId: selectedUser.id,
                status: status, // 'VERIFIED' hoặc 'REJECTED'
                notes: status === 'REJECTED' ? rejectReason : 'Approved by Admin'
            };

            let res = await reviewKyc(payload);
            if (res && res.EC === 0) {
                toast.success(res.EM || `User KYC ${status.toLowerCase()} successfully.`);
                // Cập nhật lại UI: Xóa user vừa duyệt khỏi list & reset panel phải
                setPendingList(prev => prev.filter(u => u.id !== selectedUser.id));
                setSelectedUser(null);
                setRejectReason('');
            } else {
                toast.error(res.EM || "Review action failed.");
            }
        } catch (error) {
            toast.error("Server error during review processing.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="kyc-management-page">
            <div className="page-header">
                <h4>KYC Approval Center</h4>
                <p>Verify identity documents and approve Handyman/Customer profiles.</p>
            </div>

            <div className="kyc-container">
                {/* --- CỘT TRÁI: DANH SÁCH --- */}
                <div className="kyc-list-panel shadow-sm">
                    <div className="filter-tabs">
                        <button className={filterRole === 'ALL' ? 'active' : ''} onClick={() => { setFilterRole('ALL'); setSelectedUser(null); }}>
                            All Requests
                        </button>
                        <button className={filterRole === 'HANDYMAN' ? 'active' : ''} onClick={() => { setFilterRole('HANDYMAN'); setSelectedUser(null); }}>
                            Handymen
                        </button>
                        <button className={filterRole === 'CUSTOMER' ? 'active' : ''} onClick={() => { setFilterRole('CUSTOMER'); setSelectedUser(null); }}>
                            Customers
                        </button>
                    </div>
                    
                    <div className="list-content">
                        {filteredList.length === 0 ? (
                            <div className="text-center text-muted mt-4"><small>No pending requests found.</small></div>
                        ) : (
                            filteredList.map(user => (
                                <div 
                                    key={user.id} 
                                    className={`kyc-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedUser(user); setRejectReason(''); }}
                                >
                                    <div className="card-header-top">
                                        <h6 className="name">{user.full_name}</h6>
                                        <span className="code">KYC-{user.id.substring(0,4).toUpperCase()}</span>
                                    </div>
                                    <div className="tags">
                                        <span className={`role-tag ${user.role.toLowerCase()}`}>
                                            {user.role === 'HANDYMAN' ? <FaWrench className="me-1"/> : <FaUser className="me-1"/>}
                                            {user.role === 'HANDYMAN' ? 'Pro Partner' : 'Customer'}
                                        </span>
                                        {/* Hiển thị level dựa trên số lượng file (Mô phỏng UI) */}
                                        <span className="level-tag">Docs: {(user.KycDocuments || []).length} files</span>
                                    </div>
                                    <div className="time">Submitted for review</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- CỘT PHẢI: CHI TIẾT --- */}
                <div className="kyc-detail-panel shadow-sm">
                    {!selectedUser ? (
                        <div className="empty-state">
                            <FaInbox />
                            <h5>No Request Selected</h5>
                            <p>Select a user from the list to review documents.</p>
                        </div>
                    ) : (
                        <div className="detail-content">
                            <div className="detail-header">
                                <div className="avatar">
                                    {selectedUser.role === 'HANDYMAN' ? <FaWrench size={20}/> : <FaUser size={20}/>}
                                </div>
                                <div>
                                    <h5>{selectedUser.full_name}</h5>
                                    <p>{selectedUser.email} • {selectedUser.phone_number || 'No phone provided'}</p>
                                </div>
                            </div>

                            <div className="section-title">Submitted Documents ({(selectedUser.KycDocuments || []).length})</div>
                            
                            <div className="docs-list">
                                {(!selectedUser.KycDocuments || selectedUser.KycDocuments.length === 0) ? (
                                    <div className="text-muted small">No documents attached.</div>
                                ) : (
                                    selectedUser.KycDocuments.map(doc => (
                                        <div className="doc-item" key={doc.id}>
                                            <div className="doc-name"><FaFileAlt className="text-secondary"/> {doc.document_type.replace('_', ' ')}</div>
                                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="view-link">
                                                <FaEye className="me-1"/> View File
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="action-section">
                                <div className="section-title">Review Actions</div>
                                <textarea 
                                    className="reject-reason" 
                                    placeholder="Required only if rejecting (e.g., ID is blurry)..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    disabled={isProcessing}
                                ></textarea>
                                
                                <div className="buttons">
                                    <button 
                                        className="btn-approve" 
                                        onClick={() => handleReviewAction('VERIFIED')}
                                        disabled={isProcessing}
                                    >
                                        <FaCheck /> {isProcessing ? 'Processing...' : 'Approve Profile'}
                                    </button>
                                    <button 
                                        className="btn-reject" 
                                        onClick={() => handleReviewAction('REJECTED')}
                                        disabled={isProcessing}
                                    >
                                        <FaTimes /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KycManagementPage;