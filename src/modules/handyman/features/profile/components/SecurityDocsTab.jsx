import React from 'react';
import { FaFileAlt, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import moment from 'moment';

const SecurityDocsTab = ({ account }) => {
    const authProviders = account?.auth_providers || [];
    const kycRequests = account?.kyc_requests || [];

    const isGoogleLinked = authProviders.some(p => p.provider?.toUpperCase() === 'GOOGLE');
    const isFacebookLinked = authProviders.some(p => p.provider?.toUpperCase() === 'FACEBOOK');

    return (
        <>
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
                    <button className="btn btn-sm btn-link text-danger fw-bold text-decoration-none p-0">
                        Change Password
                    </button>
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
