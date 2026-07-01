import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetailsApi, acceptBidApi } from '../../../services/jobService';
import ImageLightbox from '../../../../../core/components/ImageLightbox';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaStar, FaCommentDots } from 'react-icons/fa';
import '../styles/JobDetails.scss';

const CustomerJobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [acceptingBidId, setAcceptingBidId] = useState(null);

    const fetchJob = async () => {
        try {
            const res = await getJobDetailsApi(id);
            if (res && res.EC === 0) {
                setJob(res.DT);
            } else {
                toast.error(res.EM || "Failed to load job details.");
            }
        } catch {
            toast.error("Error fetching job details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJob();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAcceptBid = async (bidId) => {
        setAcceptingBidId(bidId);
        try {
            const res = await acceptBidApi(id, bidId);
            if (res?.EC === 0) {
                toast.success("Bid accepted! The handyman has been confirmed.");
                await fetchJob();
            } else {
                toast.error(res?.EM || "Failed to accept bid.");
            }
        } catch {
            toast.error("Error accepting bid.");
        } finally {
            setAcceptingBidId(null);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'TBD';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        const map = {
            POSTED: 'status-posted', BIDDING: 'status-bidding', ACCEPTED: 'status-accepted',
            EN_ROUTE: 'status-enroute', ARRIVED: 'status-arrived', IN_PROGRESS: 'status-inprogress',
            WARRANTY: 'status-warranty', CLOSED: 'status-completed',
        };
        return map[status] || 'status-default';
    };

    const getStatusText = (status) => {
        const map = {
            POSTED: 'Posted', BIDDING: 'Bidding', ACCEPTED: 'Accepted',
            EN_ROUTE: 'En Route', ARRIVED: 'Arrived', IN_PROGRESS: 'In Progress',
            WARRANTY: 'Warranty', CLOSED: 'Completed',
        };
        return map[status] || status;
    };

    const formatEta = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} ${hour}:${min}`;
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" /></div>;
    if (!job) return <div className="text-center p-5 text-danger">Job not found</div>;

    const steps = [
        { status: 'POSTED', label: 'Posted' },
        { status: 'BIDDING', label: 'Bidding' },
        { status: 'ACCEPTED', label: 'Accepted' },
        { status: 'EN_ROUTE', label: 'En Route' },
        { status: 'ARRIVED', label: 'Arrived' },
        { status: 'IN_PROGRESS', label: 'In Progress' },
        { status: 'CLOSED', label: 'Completed' },
        { status: 'WARRANTY', label: 'Warranty' }
    ];

    const currentStepIdx = steps.findIndex(s => s.status === job.current_status);
    const jobCode = 'JOB-' + job.id.substring(0, 4).toUpperCase();
    const activeBids = (job.Bids || []).filter(b => b.status !== 'WITHDRAWN');
    const pendingBids = activeBids.filter(b => b.status === 'PENDING');
    const budgetDisplay = job.estimated_budget_min || job.estimated_budget_max
        ? `${job.estimated_budget_min ? formatCurrency(job.estimated_budget_min) : '0 đ'} - ${job.estimated_budget_max ? formatCurrency(job.estimated_budget_max) : 'Any'}`
        : 'TBD';
    const agreedPriceDisplay = job.final_agreed_price ? formatCurrency(job.final_agreed_price) : 'Not agreed yet';

    return (
        <div className="job-details-page-container">
            <span className="back-link" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
            </span>

            <div className="job-header-row">
                <h2 className="job-title">{job.Service?.name || 'Unknown Service'}</h2>
                <span className={`status-pill ${getStatusClass(job.current_status)}`}>
                    {getStatusText(job.current_status)}
                </span>
            </div>

            {/* PROGRESS */}
            <div className="progress-card">
                <h4 className="card-title">Job Progress</h4>
                <div className="progress-steps-container">
                    {steps.map((step, idx) => {
                        let stepClass = '';
                        if (idx < currentStepIdx) stepClass = 'completed';
                        else if (idx === currentStepIdx) stepClass = 'active';
                        return (
                            <div key={step.status} className={`step-item ${stepClass}`}>
                                <div className="step-circle">
                                    {idx < currentStepIdx ? <FaCheck /> : idx + 1}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BIDS LIST — shown when job is in BIDDING stage */}
            {job.current_status === 'BIDDING' && (
                <div className="bids-card">
                    <div className="bids-card__header">
                        <h4 className="card-title mb-0">
                            Quotes from Handymen
                            <span className="bids-count-badge ms-2">{pendingBids.length}</span>
                        </h4>
                        <p className="text-muted small mt-1 mb-0">Review each quote and select the handyman you want to hire.</p>
                    </div>

                    {pendingBids.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <p className="mb-0">No bids received yet. Handymen will appear here once they apply.</p>
                        </div>
                    ) : (
                        <div className="bids-list mt-3">
                            {pendingBids.map((bid) => {
                                const handyman = bid.User;
                                const profile = handyman?.Handyman_Profile;
                                const rating = parseFloat(profile?.bayesian_score) || 0;
                                const isAccepting = acceptingBidId === bid.id;

                                const metaItems = [
                                    rating > 0 && (
                                        <span key="rating" className="bid-meta__rating">
                                            <FaStar size={11} /> {rating.toFixed(1)}
                                        </span>
                                    ),
                                    profile?.total_jobs_completed > 0 && (
                                        <span key="jobs">{profile.total_jobs_completed} jobs</span>
                                    ),
                                    profile?.handyman_level && (
                                        <span key="level" className={`bid-meta__level level-${profile.handyman_level.toLowerCase()}`}>
                                            KYC {profile.handyman_level}
                                        </span>
                                    ),
                                    bid.eta && (
                                        <span key="eta">ETA: {formatEta(bid.eta)}</span>
                                    ),
                                    bid.estimated_duration_hours && (
                                        <span key="dur">~{bid.estimated_duration_hours}h</span>
                                    ),
                                ].filter(Boolean);

                                return (
                                    <div key={bid.id} className="bid-card">
                                        <div className="bid-card__main">
                                            {/* Avatar */}
                                            {handyman?.avatar_url ? (
                                                <img src={handyman.avatar_url} alt="Handyman" className="bid-card__avatar" />
                                            ) : (
                                                <div className="bid-card__avatar-placeholder">
                                                    {handyman?.full_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}

                                            {/* Name + stats */}
                                            <div className="bid-card__info">
                                                <div className="bid-card__name">{handyman?.full_name || 'Unknown'}</div>
                                                <div className="bid-card__meta">
                                                    {metaItems.map((item, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {idx > 0 && <span className="bid-meta__sep">•</span>}
                                                            {item}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Price + hire button */}
                                            <div className="bid-card__right">
                                                <div className="bid-card__price">{formatCurrency(bid.proposed_price)}</div>
                                                <button
                                                    className="bid-card__accept-btn"
                                                    onClick={() => handleAcceptBid(bid.id)}
                                                    disabled={isAccepting}
                                                >
                                                    {isAccepting
                                                        ? <><span className="spinner-border spinner-border-sm me-1" />Confirming...</>
                                                        : 'Hire This Handyman'
                                                    }
                                                </button>
                                            </div>
                                        </div>

                                        {/* Message quote */}
                                        {bid.message && (
                                            <div className="bid-card__message">
                                                <FaCommentDots className="bid-card__message-icon" />
                                                <span>{bid.message}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* JOB DETAILS */}
            <div className="details-card">
                <h4 className="card-title">Job Details</h4>
                <div className="details-grid">
                    <div className="info-group">
                        <span className="info-label">Job Code</span>
                        <span className="info-value">{jobCode}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Category</span>
                        <span className="info-value">{job.Service?.name || 'General Repair'}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Location</span>
                        <span className="info-value">{job.service_address}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Posted Date</span>
                        <span className="info-value">{formatDateTime(job.createdAt)}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Total Bids</span>
                        <span className="info-value highlight">{activeBids.length} Handymen</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Budget Range</span>
                        <span className="info-value">{budgetDisplay}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Agreed Price</span>
                        <span className="info-value">{agreedPriceDisplay}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">Schedule Date</span>
                        <span className="info-value">{formatDateTime(job.scheduled_at)}</span>
                    </div>
                </div>

                <h5 className="section-title">Description</h5>
                <div className="description-text">{job.issue_description}</div>

                {job.images && job.images.length > 0 && (
                    <>
                        <h5 className="section-title">Job Photos</h5>
                        <div className="photo-gallery">
                            {job.images.map((img, i) => (
                                <img key={i} src={img} alt={`Job Image ${i}`} className="gallery-img"
                                    style={{ cursor: 'zoom-in' }}
                                    onClick={() => setLightboxSrc(img)} />
                            ))}
                        </div>
                    </>
                )}

                {job.SelectedHandyman && (
                    <>
                        <h5 className="section-title">Assigned Handyman</h5>
                        <div className="handyman-card">
                            {job.SelectedHandyman.avatar_url ? (
                                <img src={job.SelectedHandyman.avatar_url} alt="Handyman" className="avatar" />
                            ) : (
                                <div className="placeholder-avatar">
                                    {job.SelectedHandyman.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="user-details">
                                <span className="name">{job.SelectedHandyman.full_name}</span>
                                <span className="role-tag">Verified Handyman</span>
                                <span className="phone">{job.SelectedHandyman.phone_number}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        </div>
    );
};

export default CustomerJobDetailsPage;
