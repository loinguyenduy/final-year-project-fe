import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const ProfileDetails = ({ account, metrics, onOpenKycModal }) => {
    const userInitials = account?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const authProviders = account?.Auth_Providers || account?.AuthProviders || [];
    const isGoogleLinked = authProviders.some(p => p.provider === 'GOOGLE');
    const isFacebookLinked = authProviders.some(p => p.provider === 'FACEBOOK');

    return (
        <div className="profile-kyc-container row g-4">
            {/* Cột trái: Thẻ tóm tắt */}
            <div className="col-lg-4">
                <div className="profile-card text-center">
                    <div className="avatar-large">{userInitials}</div>
                    <h4 className="fw-bold text-dark m-0">{account?.full_name}</h4>
                    <p className="text-muted small mb-0">{account?.role} • Member since 2026</p>

                    <div className="trust-score-box">
                        <span className="small fw-bold text-secondary text-uppercase">Trust Score</span>
                        <div className="score">{metrics.trustScoreStars} / 5.0</div>
                        <div className="stars">★★★★<span className="text-muted text-opacity-25">★</span></div>
                        <p className="small text-muted mt-2 mb-0" style={{ fontSize: '11px' }}>Based on completion rate & feedback</p>
                    </div>

                    <div className="d-flex justify-content-between mt-4 px-2">
                        <div>
                            <h5 className="fw-bold text-dark m-0">{metrics.totalContracts}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Contracts</small>
                        </div>
                        <div>
                            <h5 className="fw-bold text-success m-0">{metrics.completedContracts}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Completed</small>
                        </div>
                        <div>
                            <h5 className="fw-bold text-primary m-0">{metrics.completionRate}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Rate</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cột phải: Chi tiết và KYC */}
            <div className="col-lg-8">
                <div className="d-flex flex-column gap-4">
                    
                    {/* Hộp Thông tin cá nhân */}
                    <div className="profile-card">
                        <h6 className="fw-bold text-dark mb-4">Personal Information</h6>
                        <div className="row g-4">
                            <div className="col-md-6 info-group">
                                <div className="label">Full Name</div>
                                <div className="value">{account?.full_name}</div>
                            </div>
                            <div className="col-md-6 info-group">
                                <div className="label">Email Address</div>
                                <div className="value">{account?.email}</div>
                            </div>
                            <div className="col-md-6 info-group">
                                <div className="label">Phone Number</div>
                                <div className="value">{account?.phone_number || 'Not provided'}</div>
                            </div>
                            <div className="col-md-6 info-group">
                                <div className="label">Address</div>
                                <div className="value">{account?.address || 'Not provided'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Hộp Xác minh Danh tính KYC */}
                    <div className="profile-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="fw-bold text-dark m-0">Identity Verification (KYC)</h6>
                            <span className={`badge ${account?.kyc_status === 'VERIFIED' ? 'bg-success' : account?.kyc_status === 'PENDING' ? 'bg-info' : account?.kyc_status === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {account?.kyc_status}
                            </span>
                        </div>

                        {account?.kyc_status === 'UNVERIFIED' && (
                            <div className="kyc-alert-box unverified">
                                <div className="d-flex gap-2">
                                    <FaExclamationTriangle className="text-danger flex-shrink-0 mt-1" />
                                    <div>
                                        <strong className="text-danger">ID Card is unverified!</strong>
                                        <p className="small text-danger text-opacity-75 m-0 mt-1">To protect the community and prevent fake job postings, please verify your identity securely one time.</p>
                                    </div>
                                </div>
                                <button className="btn btn-primary fw-bold mt-2 w-auto align-self-start" onClick={onOpenKycModal}>
                                    Verify Now
                                </button>
                            </div>
                        )}

                        {account?.kyc_status === 'REJECTED' && (
                            <div className="kyc-alert-box rejected">
                                <div className="d-flex gap-2">
                                    <FaExclamationTriangle className="text-danger flex-shrink-0 mt-1" />
                                    <div>
                                        <strong className="text-danger">KYC Verification Rejected</strong>
                                        <p className="small text-danger text-opacity-75 m-0 mt-1">Unfortunately, your KYC documents were rejected. Please double-check your documents and try again.</p>
                                    </div>
                                </div>
                                <button className="btn btn-danger fw-bold mt-2 w-auto align-self-start" onClick={onOpenKycModal}>
                                    Verify Again
                                </button>
                            </div>
                        )}

                        {account?.kyc_status === 'PENDING' && (
                            <div className="kyc-alert-box pending">
                                <div className="d-flex gap-2">
                                    <FaClock className="text-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <strong className="text-primary">Under Review</strong>
                                        <p className="small text-primary text-opacity-75 m-0 mt-1">Your documents have been successfully submitted and are currently being reviewed by our team.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {account?.kyc_status === 'VERIFIED' && (
                            <div className="kyc-alert-box verified">
                                <div className="d-flex gap-2">
                                    <FaCheckCircle className="text-success flex-shrink-0 mt-1" />
                                    <div>
                                        <strong className="text-success">Identity Verified</strong>
                                        <p className="small text-success text-opacity-75 m-0 mt-1">Your ID card has been verified successfully. Your personal data is encrypted securely.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hộp Bảo mật */}
                    <div className="profile-card">
                        <h6 className="fw-bold text-dark mb-4">Account Security</h6>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                            <span className="text-dark small">Two-Factor Auth (2FA)</span>
                            <span className="text-success small fw-bold">Enabled</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                            <span className="text-dark small">Google Login</span>
                            {isGoogleLinked ? (
                                <span className="text-success small fw-bold">Linked</span>
                            ) : (
                                <span className="text-muted small fw-bold">Not Linked</span>
                            )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                            <span className="text-dark small">Facebook Login</span>
                            {isFacebookLinked ? (
                                <span className="text-success small fw-bold">Linked</span>
                            ) : (
                                <span className="text-muted small fw-bold">Not Linked</span>
                            )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-dark small">Password</span>
                            <span className="text-primary small fw-bold" style={{ cursor: 'pointer' }}>Change Password</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetails;