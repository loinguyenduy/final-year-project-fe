import React from 'react';
import { useSelector } from 'react-redux';
import { FaFileAlt, FaCheck, FaTimes, FaClock, FaGoogle, FaFacebook } from 'react-icons/fa';
import moment from 'moment';

const BACKEND_URL = 'http://localhost:5000/api/v1';

const SecurityDocsTab = ({ account }) => {
    const token = useSelector(state => state.identity.token);
    const authProviders = account?.auth_providers || account?.Auth_Providers || account?.AuthProviders || [];
    const kycRequests = account?.kyc_requests || [];

    const isGoogleLinked = authProviders.some(p => p.provider?.toUpperCase() === 'GOOGLE');
    const isFacebookLinked = authProviders.some(p => p.provider?.toUpperCase() === 'FACEBOOK');

    const linkGoogle = () => {
        window.location.href = `${BACKEND_URL}/auth/google/link?token=${token}`;
    };

    const linkFacebook = () => {
        window.location.href = `${BACKEND_URL}/auth/facebook/link?token=${token}`;
    };

    return (
        <>
            <div className="content-card">
                <h6>Account Security</h6>
                <div className="security-row">
                    <span>Google Authentication</span>
                    {isGoogleLinked ? (
                        <span className="provider-status linked">Linked</span>
                    ) : (
                        <button className="btn btn-sm btn-outline-danger p-1 px-2" onClick={linkGoogle}>
                            <FaGoogle className="me-1" size={12} /> Link Google
                        </button>
                    )}
                </div>
                <div className="security-row">
                    <span>Facebook Authentication</span>
                    {isFacebookLinked ? (
                        <span className="provider-status linked">Linked</span>
                    ) : (
                        <button className="btn btn-sm btn-outline-primary p-1 px-2" onClick={linkFacebook}>
                            <FaFacebook className="me-1" size={12} /> Link Facebook
                        </button>
                    )}
                </div>
            </div>

            <div className="content-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="m-0">KYC Documents</h6>
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                        {kycRequests.length} File{kycRequests.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {kycRequests.length > 0 ? (
                    <div className="doc-list">
                        {kycRequests.map(doc => (
                            <div className={`doc-item status-${doc.status}`} key={doc.id}>
                                <div>
                                    <div className="doc-name">
                                        <FaFileAlt className="me-2" />
                                        {doc.document_type?.replace(/_/g, ' ')}
                                    </div>
                                    <div className="doc-date">
                                        {doc.status === 'APPROVED' && doc.reviewed_at
                                            ? `Approved: ${moment(doc.reviewed_at).format('DD/MM/YYYY HH:mm')}`
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
                    <div className="text-center py-4 text-muted">
                        No documents uploaded yet. Please complete KYC verification.
                    </div>
                )}
            </div>
        </>
    );
};

export default SecurityDocsTab;
