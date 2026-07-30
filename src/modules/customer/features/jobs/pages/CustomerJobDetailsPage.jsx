import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    cancelPreAcceptanceJobApi,
    getJobDetailsApi
} from '../../../services/jobService';
import ImageLightbox from '../../../../../core/components/ImageLightbox';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaStar, FaCommentDots, FaBolt, FaEdit } from 'react-icons/fa';
import '../styles/JobDetails.scss';
import CompareBidsModal from '../components/CompareBidsModal';
import PublicHandymanProfileModal from '../components/PublicHandymanProfileModal';
import HireConfirmModal from '../components/HireConfirmModal';
import PreAcceptanceCancellationModal from '../components/PreAcceptanceCancellationModal';
import JobProgressStepper from '../../../../matchmaking/components/JobProgressStepper';
import { resolveEffectiveJobProgressStatus } from '../../../../matchmaking/utils/jobProgress';
import usePreLifecycleRealtime from '../../../../matchmaking/hooks/usePreLifecycleRealtime';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';
import AiPriceGuidanceCard from '../../../../ai/components/AiPriceGuidanceCard';
import {
    getLifecycleWorkspacePath,
    isLifecycleWorkspaceStatus,
} from '../../../../matchmaking/features/job-lifecycle/utils/jobLifecycleNavigation';

const CustomerJobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const accessToken = useSelector((state) => state.identity.token);
    const [job, setJob] = useState(null);
    const [cancellation, setCancellation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [selectedBidForConfirm, setSelectedBidForConfirm] = useState(null);

    const [selectedBids, setSelectedBids] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [profileModalHandymanId, setProfileModalHandymanId] = useState(null);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchJob = async () => {
        try {
            const res = await getJobDetailsApi(id);
            if (res && res.EC === 0) {
                setJob(res.DT);
                setCancellation(res.DT?.cancellation || null);
                setSelectedBids([]); // Reset selections on refresh
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

    usePreLifecycleRealtime({
        accessToken,
        jobId: id,
        onInvalidate: () => fetchJob(),
    });

    const handleAcceptBid = (bidId) => {
        setShowCompareModal(false); // close modal if open
        const bidObj = job?.Bids?.find(b => b.id === bidId);
        const handymanName = bidObj?.User?.full_name || 'Handyman';
        setSelectedBidForConfirm({
            bidId,
            handymanName
        });
    };

    const handleCancelJob = async (payload) => {
        if (isCancelling) return;
        setIsCancelling(true);
        try {
            const response = await cancelPreAcceptanceJobApi(id, payload);
            if (response?.EC !== 0) throw response;
            toast.success(
                response.code === 'JOB_ALREADY_CANCELLED'
                    ? 'This Job was already cancelled.'
                    : 'Job cancelled. Pending Bids have expired.',
            );
            setShowCancellationModal(false);
            await fetchJob();
        } catch (error) {
            const envelope = error?.response?.data || error || {};
            toast.error(envelope.EM || 'The Job could not be cancelled. Refresh and try again.');
            if (['JOB_NOT_CANCELLABLE', 'JOB_NOT_FOUND'].includes(envelope.code)) {
                setShowCancellationModal(false);
                await fetchJob();
            }
        } finally {
            setIsCancelling(false);
        }
    };

    const handleToggleSelectBid = (bidId) => {
        setSelectedBids(prev => {
            if (prev.includes(bidId)) {
                return prev.filter(id => id !== bidId);
            } else {
                if (prev.length >= 3) {
                    toast.warning("You can compare up to 3 handymen.");
                    return prev;
                }
                return [...prev, bidId];
            }
        });
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
            POSTED: 'status-posted', BIDDING: 'status-bidding', PENDING_DEPOSIT: 'status-bidding', ACCEPTED: 'status-accepted',
            EN_ROUTE: 'status-enroute', ARRIVED: 'status-arrived', IN_PROGRESS: 'status-inprogress',
            QUOTE_PENDING: 'status-arrived', PAYMENT_PENDING: 'status-accepted',
            WARRANTY: 'status-warranty', CLOSED: 'status-completed', CANCELLED: 'status-default',
        };
        return map[status] || 'status-default';
    };

    const getStatusText = (status) => {
        const map = {
            POSTED: 'Posted', BIDDING: 'Bidding', PENDING_DEPOSIT: 'Deposit pending', ACCEPTED: 'Accepted',
            EN_ROUTE: 'En Route', ARRIVED: 'Arrived', IN_PROGRESS: 'In Progress',
            QUOTE_PENDING: 'Quote Pending', PAYMENT_PENDING: 'Payment Pending',
            WARRANTY: 'Warranty', CLOSED: 'Completed', CANCELLED: 'Cancelled',
        };
        return map[status] || 'Status updated';
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

    const formatDuration = (hours) => {
        if (!hours) return null;
        const value = Number(hours);
        if (Number.isNaN(value)) return null;
        return `${value} ${value === 1 ? 'hour' : 'hours'}`;
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" /></div>;
    if (!job) return <div className="text-center p-5 text-danger">Job not found</div>;


    const jobCode = 'JOB-' + job.id.substring(0, 4).toUpperCase();
    const activeBids = (job.Bids || []).filter(b => b.status !== 'WITHDRAWN');
    const pendingBids = activeBids.filter(b => b.status === 'PENDING');
    const budgetDisplay = job.estimated_budget_min || job.estimated_budget_max
        ? `${job.estimated_budget_min ? formatCurrency(job.estimated_budget_min) : '0 VND'} - ${job.estimated_budget_max ? formatCurrency(job.estimated_budget_max) : 'Any'}`
        : 'TBD';
    const agreedPriceDisplay = job.final_agreed_price ? formatCurrency(job.final_agreed_price) : 'Not agreed yet';

    if (isLifecycleWorkspaceStatus(job.current_status)) {
        return <Navigate to={getLifecycleWorkspacePath(id)} replace />;
    }

    return (
        <div className="job-details-page-container pb-5">
            <span className="back-link" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
            </span>

            <div className="job-header-row">
                <h2 className="job-title">{job.Service?.name || 'Unknown Service'}</h2>
                <span className={`status-pill ${getStatusClass(job.current_status)}`}>
                    {getStatusText(job.current_status)}
                </span>
                {(job.allowed_actions || []).includes('EDIT_JOB') && (
                    <button
                        type="button"
                        className="job-header-row__edit"
                        onClick={() => navigate(`/customer/my-jobs/${id}/edit`)}
                        aria-label="Edit Job"
                        title="Edit Job"
                    >
                        <FaEdit aria-hidden="true" />
                    </button>
                )}
            </div>

            {(job.allowed_actions || []).includes('CANCEL_JOB') && (
                <div className="job-pre-acceptance-actions">
                    {(job.allowed_actions || []).includes('CANCEL_JOB') && (
                        <button
                            type="button"
                            className="job-pre-acceptance-actions__cancel"
                            onClick={() => setShowCancellationModal(true)}
                        >
                            Can’t continue? Cancel this Job
                        </button>
                    )}
                </div>
            )}

            {/* PROGRESS */}
            <div className="progress-card">
                <h4 className="card-title">Job Progress</h4>
                <JobProgressStepper
                    currentStatus={resolveEffectiveJobProgressStatus({
                        currentStatus: job.current_status,
                        cancellation,
                    })}
                    statusBadge={job.current_status === 'PENDING_DEPOSIT'
                        ? 'Deposit pending'
                        : null}
                />
            </div>

            {/* JOB DETAILS (Moved up) */}
            <div className="details-card mb-4">
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
                <AiPriceGuidanceCard
                    guidance={job.ai_price_guidance}
                    tone="customer"
                    className="job-details-ai-guidance"
                />

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
                        <div className="handyman-card" onClick={() => setProfileModalHandymanId(job.SelectedHandyman.id)} style={{cursor: 'pointer'}}>
                            <ParticipantAvatar name={job.SelectedHandyman.full_name} src={job.SelectedHandyman.avatar_url} role="HANDYMAN" />
                            <div className="user-details">
                                <span className="name">{job.SelectedHandyman.full_name}</span>
                                <span className="role-tag">Verified Handyman</span>
                                <span className="phone">{job.SelectedHandyman.phone_number}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* BIDS LIST - shown when job is in BIDDING stage */}
            {job.current_status === 'BIDDING' && (
                <div className="bids-card">
                    <div className="bids-card__header mb-3">
                        <h4 className="card-title mb-0">
                            Handyman Quotes
                            <span className="bids-count-badge ms-2">{pendingBids.length}</span>
                        </h4>
                        <div className="bids-header-subtext mt-3 p-3">
                            <div className="bids-header-subtext__title">
                                <FaBolt color="#eab308" /> {pendingBids.length} quotes received - private bidding
                            </div>
                            <p className="small mt-1 mb-0">
                                Select up to 3 handymen to compare price, reliability, experience, and timing side by side.
                            </p>
                        </div>
                    </div>

                    {pendingBids.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <p className="mb-0">No bids received yet. Handymen will appear here once they apply.</p>
                        </div>
                    ) : (
                        <div className="bids-list">
                            {pendingBids.map((bid) => {
                                const handyman = bid.User;
                                const profile = handyman?.profile;
                                const rating = profile?.rating_summary?.average_rating
                                    ? parseFloat(profile.rating_summary.average_rating)
                                    : null;
                                const isAccepting = selectedBidForConfirm?.bidId === bid.id;
                                const isSelected = selectedBids.includes(bid.id);

                                const metaItems = [
                                    rating !== null && (
                                        <span key="rating" className="bid-meta__rating">
                                            <FaStar size={11} /> {rating.toFixed(1)}
                                        </span>
                                    ),
                                    profile?.total_jobs_completed > 0 && (
                                        <span key="jobs">{profile.total_jobs_completed} jobs</span>
                                    ),
                                    bid.eta && (
                                        <span key="eta">ETA: {formatEta(bid.eta)}</span>
                                    ),
                                    bid.estimated_duration_hours && (
                                        <span key="duration">{formatDuration(bid.estimated_duration_hours)}</span>
                                    ),
                                ].filter(Boolean);

                                return (
                                    <div key={bid.id} className={`bid-card-wrapper ${bid.isBestChoice ? 'is-best-choice' : ''}`}>
                                        {bid.isBestChoice && (
                                            <div className="best-choice-badge">
                                                <FaStar /> Recommended by Trusted Handyman
                                            </div>
                                        )}
                                        <div className={`bid-card ${isSelected ? 'selected' : ''}`}>
                                            <div className="bid-card__main">
                                                <div className="bid-card__checkbox">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectBid(bid.id)}
                                                    />
                                                </div>

                                                {/* Avatar */}
                                                <div 
                                                    className="bid-card__avatar-wrapper"
                                                    onClick={() => setProfileModalHandymanId(handyman.id)}
                                                >
                                                    <ParticipantAvatar name={handyman?.full_name} src={handyman?.avatar_url} role="HANDYMAN" />
                                                </div>

                                                {/* Name + stats */}
                                                <div className="bid-card__info" onClick={() => setProfileModalHandymanId(handyman.id)}>
                                                    <div className="bid-card__name-row">
                                                        <span className="bid-card__name">{handyman?.full_name || 'Unknown'}</span>
                                                        {profile?.handyman_level && (
                                                            <span className={`kyc-badge level-${profile.handyman_level.toLowerCase()}`}>
                                                                {handyman?.kyc_status || 'UNVERIFIED'} / {profile.handyman_level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="bid-card__meta">
                                                        {metaItems.map((item, idx) => (
                                                            <React.Fragment key={idx}>
                                                                {idx > 0 && <span className="bid-meta__sep">•</span>}
                                                                {item}
                                                            </React.Fragment>
                                                        ))}
                                                        {bid.match_score && (
                                                            <>
                                                                <span className="bid-meta__sep">•</span>
                                                                <span className="match-score-text">{bid.match_score}% match</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Match Progress Bar */}
                                                    {bid.match_score && (
                                                        <div className="match-progress-container mt-2">
                                                            <div className="match-progress-bar">
                                                                <div 
                                                                    className="match-progress-fill" 
                                                                    style={{ width: `${Math.min(bid.match_score, 100)}%` }} 
                                                                />
                                                            </div>
                                                            <span className="match-progress-label">{bid.match_score}% match</span>
                                                        </div>
                                                    )}
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
                                                            : 'Hire'
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
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* FLOATING COMPARE BAR */}
            {selectedBids.length > 0 && (
                <div className="floating-compare-bar">
                    <div className="compare-bar-content">
                        <span><strong>{selectedBids.length}</strong> selected (max 3)</span>
                        <div className="compare-actions">
                            <button className="btn btn-outline-secondary me-2" onClick={() => setSelectedBids([])}>Clear</button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowCompareModal(true)}
                                disabled={selectedBids.length < 1}
                            >
                                Compare
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            
            {showCompareModal && (
                <CompareBidsModal 
                    jobId={id} 
                    selectedBidIds={selectedBids} 
                    onClose={() => setShowCompareModal(false)} 
                    onAcceptBid={handleAcceptBid}
                />
            )}

            {profileModalHandymanId && (
                <PublicHandymanProfileModal 
                    jobId={id} 
                    handymanId={profileModalHandymanId} 
                    onClose={() => setProfileModalHandymanId(null)} 
                />
            )}

            {selectedBidForConfirm && (
                <HireConfirmModal
                    jobId={id}
                    bidId={selectedBidForConfirm.bidId}
                    handymanName={selectedBidForConfirm.handymanName}
                    onClose={() => setSelectedBidForConfirm(null)}
                    onSuccess={fetchJob}
                />
            )}
            <PreAcceptanceCancellationModal
                open={showCancellationModal}
                onClose={() => {
                    if (!isCancelling) setShowCancellationModal(false);
                }}
                onConfirm={handleCancelJob}
                submitting={isCancelling}
            />
        </div>
    );
};

export default CustomerJobDetailsPage;
