import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaGoogle, FaFacebook, FaLock, FaStar } from 'react-icons/fa';
import { updateUserAddressApi, getProvincesApi, getWardsByProvinceApi } from '../../../services/profileService';
import PasswordSecurityPanel from '../../../../identity/features/auth/components/PasswordSecurityPanel';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';

const BACKEND_URL = 'http://localhost:5000/api/v1';

const ProfileDetails = ({ account, section = 'overview', onSectionChange, reviewsContent, onOpenKycModal, onRefresh }) => {
    const token = useSelector(state => state.identity.token);
    const authProviders = account?.linked_providers || [];
    const isGoogleLinked = authProviders.some(p => String(p?.provider || p).toUpperCase() === 'GOOGLE');
    const isFacebookLinked = authProviders.some(p => String(p?.provider || p).toUpperCase() === 'FACEBOOK');

    const addresses = account?.saved_addresses || [];
    const defaultAddress = addresses.find(a => a.is_default) || addresses[0];

    const [editingAddress, setEditingAddress] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [addrLoading, setAddrLoading] = useState(false);

    const startEditAddress = async () => {
        if (provinces.length === 0) {
            try {
                const res = await getProvincesApi();
                if (res && res.EC === 0) setProvinces(res.DT || []);
                else { toast.error('Failed to load provinces.'); return; }
            } catch { toast.error('Failed to load provinces.'); return; }
        }
        setSelectedProvince(defaultAddress?.province_code || '');
        setSelectedWard(defaultAddress?.ward_code || '');
        setDetailAddress(defaultAddress?.detail_address || '');
        setEditingAddress(true);
    };

    useEffect(() => {
        if (!selectedProvince) { setWards([]); return; }
        getWardsByProvinceApi(selectedProvince)
            .then(res => { if (res && res.EC === 0) setWards(res.DT || []); })
            .catch(() => {});
    }, [selectedProvince]);

    const saveAddress = async () => {
        if (!selectedProvince || !selectedWard || !detailAddress.trim()) {
            toast.error('Please fill in Province, Ward and Street address.');
            return;
        }
        setAddrLoading(true);
        try {
            const res = await updateUserAddressApi({
                province_code: selectedProvince,
                ward_code: selectedWard,
                detail_address: detailAddress.trim()
            });
            if (res && res.EC === 0) {
                toast.success('Address updated successfully.');
                setEditingAddress(false);
                onRefresh?.();
            } else {
                toast.error(res?.EM || 'Failed to update address.');
            }
        } catch { toast.error('Failed to update address.'); }
        setAddrLoading(false);
    };

    const linkGoogle = () => {
        window.location.href = `${BACKEND_URL}/auth/google/link?token=${token}`;
    };
    const linkFacebook = () => {
        window.location.href = `${BACKEND_URL}/auth/facebook/link?token=${token}`;
    };

    return (
        <div className="profile-kyc-container row g-4">
            {/* Left: summary card */}
            <div className="col-lg-4">
                <div className="profile-card profile-summary-card text-center">
                    <ParticipantAvatar name={account?.full_name} src={account?.avatar_url} role="CUSTOMER" size="large" className="avatar-large" />
                    <h4 className="fw-bold text-dark m-0">{account?.full_name}</h4>
                    <p className="text-muted small mb-0">{account?.role} • Member since 2026</p>

                    <div className="trust-score-box">
                        <span className="small fw-bold text-secondary text-uppercase">Average rating</span>
                        {account?.rating_summary?.average_rating ? (
                            <div className="score"><span>{account.rating_summary.average_rating}</span><FaStar aria-label="star" /></div>
                        ) : <div className="score score-empty">No reviews yet</div>}
                        <p className="small text-muted mt-2 mb-0" style={{ fontSize: '11px' }}>{account?.rating_summary?.review_count || 0} verified Job reviews</p>
                    </div>

                    <div className="profile-summary-stats">
                        <div>
                            <h5 className="fw-bold text-dark m-0">{account?.job_summary?.total || 0}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Contracts</small>
                        </div>
                        <div>
                            <h5 className="fw-bold text-success m-0">{account?.job_summary?.closed || 0}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Completed</small>
                        </div>
                        <div>
                            <h5 className="fw-bold text-primary m-0">{account?.job_summary?.active || 0}</h5>
                            <small className="text-muted" style={{ fontSize: '12px' }}>Active Jobs</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: details */}
            <div className="col-lg-8">
                <div className="profile-content-column d-flex flex-column gap-4">
                    <div className="participant-profile-tabs" role="tablist" aria-label="Profile sections">
                        {['overview', 'reviews', 'security'].map((tab) => (
                            <button key={tab} type="button" role="tab" aria-selected={section === tab} className={section === tab ? 'active' : ''} onClick={() => onSectionChange?.(tab)}>
                                {tab[0].toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {section === 'overview' && <>
                    {/* Personal Information */}
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
                                <div className="value d-flex align-items-center gap-2">
                                    {account?.phone_number || 'Not provided'}
                                    <FaLock className="text-muted" size={11} />
                                </div>
                            </div>
                            <div className="col-md-6 info-group">
                                <div className="label d-flex justify-content-between align-items-center">
                                    <span>Address</span>
                                    {!editingAddress && (
                                        <button
                                            className="btn btn-link btn-sm p-0 text-primary text-decoration-none"
                                            style={{ fontSize: '12px' }}
                                            onClick={startEditAddress}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {!editingAddress ? (
                                    <div className="value">{defaultAddress?.full_address || 'Not provided'}</div>
                                ) : (
                                    <div className="mt-2">
                                        <select
                                            className="form-select form-select-sm mb-2"
                                            value={selectedProvince}
                                            onChange={e => { setSelectedProvince(e.target.value); setSelectedWard(''); }}
                                        >
                                            <option value="">Select Province / City</option>
                                            {provinces.map(p => (
                                                <option key={p.province_code} value={p.province_code}>{p.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-select form-select-sm mb-2"
                                            value={selectedWard}
                                            onChange={e => setSelectedWard(e.target.value)}
                                            disabled={!selectedProvince}
                                        >
                                            <option value="">Select Ward</option>
                                            {wards.map(w => (
                                                <option key={w.ward_code} value={w.ward_code}>{w.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            className="form-control form-control-sm mb-2"
                                            placeholder="Street / House number"
                                            value={detailAddress}
                                            onChange={e => setDetailAddress(e.target.value)}
                                        />
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={saveAddress}
                                                disabled={addrLoading}
                                            >
                                                {addrLoading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => setEditingAddress(false)}
                                                disabled={addrLoading}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KYC Verification */}
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
                                        <p className="small text-danger text-opacity-75 m-0 mt-1">
                                            {account?.kyc_rejection?.message || 'Unfortunately, your KYC documents were rejected. Please double-check your documents and try again.'}
                                        </p>
                                        {account?.kyc_rejection?.reason_text && (
                                            <p className="small text-danger m-0 mt-1"><strong>Reviewer note:</strong> {account.kyc_rejection.reason_text}</p>
                                        )}
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

                    </>}
                    {section === 'reviews' && reviewsContent}
                    {section === 'security' && <>
                    {/* Account Security */}
                    <div className="profile-card">
                        <h6 className="fw-bold text-dark mb-4">Account Security</h6>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                            <span className="text-dark small">Google Login</span>
                            {isGoogleLinked ? (
                                <span className="text-success small fw-bold">Linked</span>
                            ) : (
                                <button className="btn btn-sm btn-outline-danger p-1 px-2" onClick={linkGoogle}>
                                    <FaGoogle className="me-1" size={12} /> Link Google
                                </button>
                            )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-dark small">Facebook Login</span>
                            {isFacebookLinked ? (
                                <span className="text-success small fw-bold">Linked</span>
                            ) : (
                                <button className="btn btn-sm btn-outline-primary p-1 px-2" onClick={linkFacebook}>
                                    <FaFacebook className="me-1" size={12} /> Link Facebook
                                </button>
                            )}
                        </div>
                    </div>

                    <PasswordSecurityPanel capability={account?.password_capability} />
                    </>}

                </div>
            </div>
        </div>
    );
};

export default ProfileDetails;
