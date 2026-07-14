import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaPhoneAlt, FaStar, FaMapMarkerAlt, FaShieldAlt, FaChevronDown, FaChevronUp, FaMoneyBillWave } from 'react-icons/fa';
import { getAcceptedJobDetailsApi } from '../../../api/acceptedJobApi';
import { CustomerCancellationModal, HandymanCancellationModal, StartMovingModal } from './AcceptedJobModals';
import ImageLightbox from '../../../../../core/components/ImageLightbox';
import JobProgressTracker from '../../../components/JobProgressTracker';
import AcceptedJobChat from '../../../../chat/components/AcceptedJobChat';
import '../styles/AcceptedJob.scss';

const formatCurrency = (val) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const AcceptedJobView = ({ jobId, role }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [details, setDetails] = useState(null);
    
    // UI states
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    
    // Modals
    const [showCustomerCancelReopen, setShowCustomerCancelReopen] = useState(false);
    const [showCustomerCancelJob, setShowCustomerCancelJob] = useState(false);
    const [showHandymanCancel, setShowHandymanCancel] = useState(false);
    const [showStartMoving, setShowStartMoving] = useState(false);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAcceptedJobDetailsApi(jobId);
            if (res && res.EC === 0) {
                setDetails(res.DT);
            } else {
                // If job is already EN_ROUTE or other statuses
                if (res?.code === 'INVALID_JOB_STATUS') {
                    toast.info('Job status has changed. Reloading...');
                    navigate(0); // Simple reload or can push to another state
                } else if (res?.code === 'JOB_ALREADY_EN_ROUTE') {
                    toast.info('Job is already En Route.');
                    navigate(0);
                } else {
                    setError(res?.EM || 'Failed to load job details.');
                }
            }
        } catch (err) {
            setError('An error occurred while fetching details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [jobId]);

    const handleCustomerActionSuccess = (actionType) => {
        setShowCustomerCancelReopen(false);
        setShowCustomerCancelJob(false);
        if (actionType === 'REOPEN_BIDDING') {
            // Force reload to go back to Bidding view (which CustomerJobDetailsPage will handle based on new status)
            navigate(0); 
        } else {
            // Go to cancelled jobs list or job history
            navigate('/customer/my-jobs');
        }
    };

    const handleHandymanCancelSuccess = () => {
        setShowHandymanCancel(false);
        navigate('/handyman/find-jobs');
    };

    const handleStartMovingSuccess = () => {
        setShowStartMoving(false);
        // Force reload so HandymanJobDetailsPage re-renders with EN_ROUTE status
        navigate(0);
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="spinner-border text-primary" role="status" />
        </div>
    );
    if (error) return <div className="text-center p-5 text-danger fw-bold">{error}</div>;
    if (!details) return null;

    const { job, selected_bid, deposit, partner, allowed_actions } = details;
    const isCustomer = role === 'CUSTOMER';
    const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;

    return (
        <div className="accepted-job-container">
            <div className="container" style={{ maxWidth: '960px' }}>
                <button className="back-btn" onClick={() => navigate(isCustomer ? '/customer/my-jobs' : '/handyman/my-bids')}>
                    <FaArrowLeft /> Back to Jobs
                </button>

                <div className="row g-4">
                    {/* Left Column */}
                    <div className="col-12 col-lg-8">
                        
                        {/* Status Header */}
                        <div className="card-panel status-header">
                            <div className="title-row">
                                <h2>{isCustomer ? 'Handyman Assigned' : 'You got the Job!'}</h2>
                                <span className="badge-accepted">ACCEPTED</span>
                            </div>
                            <p className="subtitle">
                                {isCustomer 
                                    ? 'Your deposit is secured. Review the details and wait for the handyman to start moving.'
                                    : 'The customer selected you for this job. Review the details before you head out.'}
                            </p>
                            
                            {/* Progress Tracker */}
                            <JobProgressTracker currentStatus="ACCEPTED" />
                        </div>

                        {/* Job Summary Accordion */}
                        <div className="card-panel job-summary">
                            <div className="summary-header">
                                <div className="job-info">
                                    <div className="job-code">{jobCode}</div>
                                    <h3 className="service-name">{job.service?.name || 'General Service'}</h3>
                                </div>
                                <div className="job-price">{formatCurrency(selected_bid.proposed_price)}</div>
                            </div>
                            
                            <button className="toggle-btn" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                                {isDetailsOpen ? (
                                    <><FaChevronUp /> Hide Job Details</>
                                ) : (
                                    <><FaChevronDown /> View Job Details</>
                                )}
                            </button>

                            {isDetailsOpen && (
                                <div className="details-content">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="label"><FaMapMarkerAlt /> Location</span>
                                            <span className="value">{job.service_address}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label"><FaMoneyBillWave /> Scheduled Time</span>
                                            <span className="value">{formatDateTime(job.scheduled_at)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Accepted At</span>
                                            <span className="value">{formatDateTime(job.accepted_at)}</span>
                                        </div>
                                    </div>

                                    <div className="description">
                                        {job.issue_description}
                                    </div>

                                    {job.images && job.images.length > 0 && (
                                        <div className="image-gallery">
                                            {job.images.map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    alt={`Job img ${idx}`} 
                                                    onClick={() => setLightboxSrc(img)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Partner Card */}
                        <div className="card-panel">
                            <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                {isCustomer ? 'Assigned Handyman' : 'Customer Info'}
                            </h6>
                            <div className="partner-info">
                                {partner.avatar_url ? (
                                    <img src={partner.avatar_url} alt="Avatar" className="avatar" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {partner.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="details">
                                    <div className="name">{partner.full_name}</div>
                                    <div className="meta">
                                        <div className="rating">
                                            <FaStar /> {partner.rating || 'New'}
                                        </div>
                                        <span>•</span>
                                        <span>{partner.review_count} reviews</span>
                                        {partner.completion_rate !== null && (
                                            <>
                                                <span>•</span>
                                                <span>{partner.completion_rate}% completion</span>
                                            </>
                                        )}
                                        {!isCustomer && job.service_address && (
                                            <div className="w-100 mt-1 d-flex align-items-center gap-1">
                                                <FaMapMarkerAlt size={12} /> {job.service_address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="actions">
                                    <AcceptedJobChat
                                        key={jobId}
                                        jobId={jobId}
                                        jobCode={jobCode}
                                        partner={partner}
                                        role={role}
                                        onRefreshJob={() => navigate(0)}
                                    />
                                    <button className="btn-icon" onClick={() => {
                                        navigator.clipboard.writeText(partner.phone_number);
                                        toast.success('Phone number copied!');
                                    }}>
                                        <FaPhoneAlt size={12} /> {partner.phone_number}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                        
                        {/* Deposit Card */}
                        <div className="deposit-secure shadow-sm">
                            <div className="icon"><FaShieldAlt /></div>
                            <div className="content">
                                <div className="title">Deposit Secured</div>
                                <div className="desc">{deposit.label}</div>
                            </div>
                        </div>

                        {/* Selected Bid Info */}
                        <div className="info-card shadow-sm">
                            <h6>Selected Quote</h6>
                            <div className="row-data border-bottom pb-2">
                                <span className="lbl">Agreed Price</span>
                                <span className="highlight-val m-0">{formatCurrency(selected_bid.proposed_price)}</span>
                            </div>
                            
                            {selected_bid.message && (
                                <div className="note mt-2 pt-2 border-0">
                                    "{selected_bid.message}"
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="action-panel p-3 bg-white border rounded-3 shadow-sm">
                            <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Actions</h6>
                            
                            {isCustomer ? (
                                <>
                                    {allowed_actions.includes('REOPEN_BIDDING') && (
                                        <button 
                                            className="secondary-outline"
                                            onClick={() => setShowCustomerCancelReopen(true)}
                                        >
                                            Find Another Handyman
                                        </button>
                                    )}
                                    {allowed_actions.includes('CANCEL_JOB') && (
                                        <button 
                                            className="danger-outline"
                                            onClick={() => setShowCustomerCancelJob(true)}
                                        >
                                            Cancel Job
                                        </button>
                                    )}
                                    {!allowed_actions.includes('REOPEN_BIDDING') && !allowed_actions.includes('CANCEL_JOB') && (
                                        <div className="text-muted small text-center">No actions available.</div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {allowed_actions.includes('START_MOVING') && (
                                        <button 
                                            className="primary-action"
                                            onClick={() => setShowStartMoving(true)}
                                        >
                                            Start Moving
                                        </button>
                                    )}
                                    {allowed_actions.includes('CANCEL_ACCEPTED_JOB') && (
                                        <button 
                                            className="danger-outline"
                                            onClick={() => setShowHandymanCancel(true)}
                                        >
                                            Cannot Continue Job
                                        </button>
                                    )}
                                    {!allowed_actions.includes('START_MOVING') && !allowed_actions.includes('CANCEL_ACCEPTED_JOB') && (
                                        <div className="text-muted small text-center">No actions available.</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CustomerCancellationModal 
                show={showCustomerCancelReopen} 
                onHide={() => setShowCustomerCancelReopen(false)} 
                jobId={jobId} 
                actionType="REOPEN_BIDDING"
                onSuccess={handleCustomerActionSuccess} 
            />
            
            <CustomerCancellationModal 
                show={showCustomerCancelJob} 
                onHide={() => setShowCustomerCancelJob(false)} 
                jobId={jobId} 
                actionType="CANCEL_JOB"
                onSuccess={handleCustomerActionSuccess} 
            />

            <HandymanCancellationModal 
                show={showHandymanCancel} 
                onHide={() => setShowHandymanCancel(false)} 
                jobId={jobId} 
                onSuccess={handleHandymanCancelSuccess} 
            />

            <StartMovingModal 
                show={showStartMoving} 
                onHide={() => setShowStartMoving(false)} 
                jobId={jobId} 
                onSuccess={handleStartMovingSuccess} 
            />

            <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        </div>
    );
};

export default AcceptedJobView;
