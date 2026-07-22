import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCachedLocation } from '../../../../../core/utils/locationCache';
import { getJobDetailsApi, submitBidApi, updateBidApi, withdrawBidApi } from '../../../services/jobService';
import ImageLightbox from '../../../../../core/components/ImageLightbox';
import { toast } from 'react-toastify';
import {
    FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaClock,
    FaPhone, FaStar, FaLocationArrow, FaUsers, FaEdit, FaTimesCircle,
    FaCheckCircle, FaPaperPlane
} from 'react-icons/fa';
import '../styles/FindJob.scss';
import {
    getLifecycleWorkspacePath,
    isLifecycleWorkspaceStatus,
} from '../../../../matchmaking/features/job-lifecycle/utils/jobLifecycleNavigation';
import usePreLifecycleRealtime from '../../../../matchmaking/hooks/usePreLifecycleRealtime';

const STATUS_TEXT = {
    POSTED: 'Looking for Handyman',
    BIDDING: 'Accepting Bids',
    ACCEPTED: 'Assigned',
    EN_ROUTE: 'En Route',
    ARRIVED: 'Arrived',
    IN_PROGRESS: 'In Progress',
    WARRANTY: 'Warranty',
    CLOSED: 'Completed',
    CANCELLED: 'Cancelled',
};

const STATUS_BADGE_CLASS = {
    POSTED: 'posted', BIDDING: 'bidding', ACCEPTED: 'accepted',
    EN_ROUTE: 'enroute', ARRIVED: 'arrived', IN_PROGRESS: 'inprogress',
    WARRANTY: 'warranty', CLOSED: 'completed',
    CANCELLED: 'cancelled',
};

const INITIAL_FORM = { proposed_price: '', message: '', eta: '', estimated_duration_hours: '' };

const HandymanJobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token: accessToken, account } = useSelector((state) => state.identity);

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

    const fetchJob = async () => {
        const coords = getCachedLocation();
        try {
            const res = await getJobDetailsApi(id, coords?.lat, coords?.long);
            if (res?.EC === 0) {
                setJob(res.DT);
            } else {
                toast.error(res?.EM || "Failed to load job details.");
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

    const myBid = job?.Bids?.[0] || null;
    const canBid = job && ['POSTED', 'BIDDING'].includes(job.current_status);

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmitBid = async (e) => {
        e.preventDefault();
        if (!formData.proposed_price || Number(formData.proposed_price) <= 0) {
            toast.error("Please enter a valid proposed price.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                proposed_price: Number(formData.proposed_price),
                message: formData.message || undefined,
                eta: formData.eta || undefined,
                estimated_duration_hours: formData.estimated_duration_hours ? Number(formData.estimated_duration_hours) : undefined,
            };
            const res = await submitBidApi(id, payload);
            if (res?.EC === 0) {
                toast.success("Bid submitted successfully!");
                setFormData(INITIAL_FORM);
                await fetchJob();
            } else {
                toast.error(res?.EM || "Failed to submit bid.");
            }
        } catch {
            toast.error("Error submitting bid.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateBid = async (e) => {
        e.preventDefault();
        if (!formData.proposed_price || Number(formData.proposed_price) <= 0) {
            toast.error("Please enter a valid proposed price.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                proposed_price: Number(formData.proposed_price),
                message: formData.message,
                eta: formData.eta || null,
                estimated_duration_hours: formData.estimated_duration_hours ? Number(formData.estimated_duration_hours) : null,
            };
            const res = await updateBidApi(id, myBid.id, payload);
            if (res?.EC === 0) {
                toast.success("Bid updated successfully!");
                setIsEditing(false);
                await fetchJob();
            } else {
                toast.error(res?.EM || "Failed to update bid.");
            }
        } catch {
            toast.error("Error updating bid.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdrawBid = async () => {
        setWithdrawing(true);
        try {
            const res = await withdrawBidApi(id, myBid.id);
            if (res?.EC === 0) {
                toast.success("Bid withdrawn.");
                setShowWithdrawConfirm(false);
                await fetchJob();
            } else {
                toast.error(res?.EM || "Failed to withdraw bid.");
            }
        } catch {
            toast.error("Error withdrawing bid.");
        } finally {
            setWithdrawing(false);
        }
    };

    const startEditing = () => {
        setFormData({
            proposed_price: myBid.proposed_price || '',
            message: myBid.message || '',
            eta: myBid.eta ? new Date(myBid.eta).toISOString().slice(0, 16) : '',
            estimated_duration_hours: myBid.estimated_duration_hours || '',
        });
        setIsEditing(true);
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getTimeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diff < 60) return `${diff} min ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
        return `${Math.floor(diff / 1440)} day(s) ago`;
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="spinner-border text-warning" role="status" />
        </div>
    );
    if (!job) return <div className="text-center p-5 text-danger fw-bold">Job not found</div>;

    const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;
    const budgetDisplay = job.estimated_budget_min && job.estimated_budget_max
        ? `${formatCurrency(job.estimated_budget_min)} – ${formatCurrency(job.estimated_budget_max)}`
        : job.estimated_budget_max ? formatCurrency(job.estimated_budget_max) : 'Negotiable';
    const avgRating = job.Customer?.rating_summary?.bayesian_rating || null;
    const canSeePhone = !['POSTED', 'BIDDING'].includes(job.current_status);

    if (isLifecycleWorkspaceStatus(job.current_status)
        && job.selected_handyman_id === account?.id
        && myBid?.status === 'WON') {
        return <Navigate to={getLifecycleWorkspacePath(id)} replace />;
    }

    // ── Right panel renderer ──────────────────────────────────────────────

    const renderBidPanel = () => {
        // Job is no longer open for bidding
        if (!canBid) {
            if (myBid?.status === 'WON') {
                return (
                    <div className="bid-panel bid-panel--won">
                        <div className="bid-panel__icon-wrap">
                            <FaCheckCircle size={32} className="text-success" />
                        </div>
                        <h6 className="bid-panel__title text-success">You Won This Job!</h6>
                        <p className="bid-panel__desc text-muted small">
                            The customer selected your bid. Get ready to head to the job site.
                        </p>
                        <div className="bid-panel__info-row">
                            <span>Your bid</span>
                            <strong style={{ color: '#16a34a' }}>{formatCurrency(myBid.proposed_price)}</strong>
                        </div>
                    </div>
                );
            }
            if (myBid?.status === 'LOST') {
                return (
                    <div className="bid-panel bid-panel--lost">
                        <div className="bid-panel__icon-wrap">
                            <FaTimesCircle size={32} className="text-secondary" />
                        </div>
                        <h6 className="bid-panel__title text-secondary">Not Selected</h6>
                        <p className="bid-panel__desc text-muted small">
                            The customer chose another handyman for this job.
                        </p>
                        <div className="bid-panel__info-row">
                            <span>Your bid was</span>
                            <strong>{formatCurrency(myBid.proposed_price)}</strong>
                        </div>
                    </div>
                );
            }
            return (
                <div className="bid-panel bid-panel--closed">
                    <h6 className="bid-panel__title text-muted">Job Not Available</h6>
                    <p className="bid-panel__desc text-muted small">
                        This job is no longer accepting bids.
                    </p>
                </div>
            );
        }

        // Handyman has already submitted a bid
        if (myBid) {
            if (myBid.status === 'WITHDRAWN') {
                return (
                    <div className="bid-panel bid-panel--withdrawn">
                        <div className="bid-panel__icon-wrap mb-2 text-center">
                            <FaTimesCircle size={32} className="text-secondary" />
                        </div>
                        <h6 className="bid-panel__title text-secondary text-center">Bid Withdrawn</h6>
                        <p className="bid-panel__desc text-muted small text-center">
                            You have withdrawn your bid for this job.
                        </p>
                    </div>
                );
            }
            if (myBid.status === 'CANCELLED_BY_HANDYMAN') {
                return (
                    <div className="bid-panel bid-panel--cancelled">
                        <div className="bid-panel__icon-wrap mb-2 text-center">
                            <FaTimesCircle size={32} className="text-danger" />
                        </div>
                        <h6 className="bid-panel__title text-danger text-center">Withdrawn From Job</h6>
                        <p className="bid-panel__desc text-muted small text-center">
                            You cancelled this job after being selected. You are not allowed to bid on this job again.
                        </p>
                    </div>
                );
            }
            if (myBid.status === 'CANCELLED_BY_CUSTOMER') {
                return (
                    <div className="bid-panel bid-panel--cancelled">
                        <div className="bid-panel__icon-wrap mb-2 text-center">
                            <FaTimesCircle size={32} className="text-danger" />
                        </div>
                        <h6 className="bid-panel__title text-danger text-center">Selection Cancelled</h6>
                        <p className="bid-panel__desc text-muted small text-center">
                            The customer cancelled your selection for this job. You are not allowed to bid on this job again.
                        </p>
                    </div>
                );
            }

            if (isEditing) {
                return (
                    <div className="bid-panel">
                        <h6 className="bid-panel__title">Edit Your Bid</h6>
                        <form onSubmit={handleUpdateBid}>
                            <BidFormFields formData={formData} onChange={handleFormChange} />
                            <button type="submit" className="btn bid-panel__submit-btn w-100 mt-3" disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                Save Changes
                            </button>
                            <button type="button" className="btn bid-panel__cancel-btn w-100 mt-2"
                                onClick={() => setIsEditing(false)} disabled={submitting}>
                                Cancel
                            </button>
                        </form>
                    </div>
                );
            }

            return (
                <div className="bid-panel bid-panel--submitted">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="bid-panel__title mb-0">Your Bid</h6>
                        <span className="bid-status-badge bid-status-badge--pending">Pending</span>
                    </div>

                    <div className="bid-panel__info-row">
                        <span>Proposed price</span>
                        <strong className="bid-price">{formatCurrency(myBid.proposed_price)}</strong>
                    </div>
                    {myBid.eta && (
                        <div className="bid-panel__info-row">
                            <span>Arrival time</span>
                            <strong>{formatDateTime(myBid.eta)}</strong>
                        </div>
                    )}
                    {myBid.estimated_duration_hours && (
                        <div className="bid-panel__info-row">
                            <span>Est. duration</span>
                            <strong>{myBid.estimated_duration_hours}h</strong>
                        </div>
                    )}
                    {myBid.message && (
                        <div className="bid-panel__message">
                            <span className="bid-panel__message-label">Your note</span>
                            <p className="bid-panel__message-text">{myBid.message}</p>
                        </div>
                    )}

                    {job.active_bid_count > 0 && (
                        <div className="bid-competition-note">
                            <FaUsers size={13} className="me-1" />
                            {job.active_bid_count} handyman{job.active_bid_count > 1 ? 's' : ''} currently bidding
                        </div>
                    )}

                    <div className="d-flex gap-2 mt-3">
                        <button className="btn bid-panel__edit-btn flex-fill" onClick={startEditing}>
                            <FaEdit size={13} className="me-1" /> Edit
                        </button>
                        <button className="btn bid-panel__withdraw-btn flex-fill"
                            onClick={() => setShowWithdrawConfirm(true)}>
                            <FaTimesCircle size={13} className="me-1" /> Withdraw
                        </button>
                    </div>

                    {showWithdrawConfirm && (
                        <div className="withdraw-confirm mt-3">
                            <p className="small text-danger mb-2">Are you sure you want to withdraw your bid?</p>
                            <div className="d-flex gap-2">
                                <button className="btn btn-danger btn-sm flex-fill"
                                    onClick={handleWithdrawBid} disabled={withdrawing}>
                                    {withdrawing ? <span className="spinner-border spinner-border-sm" /> : 'Yes, Withdraw'}
                                </button>
                                <button className="btn btn-outline-secondary btn-sm flex-fill"
                                    onClick={() => setShowWithdrawConfirm(false)} disabled={withdrawing}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // No bid yet — show submit form
        return (
            <div className="bid-panel">
                <h6 className="bid-panel__title">Submit Your Bid</h6>
                <p className="bid-panel__desc text-muted small mb-3">
                    Your bid amount is private — other handymen cannot see it.
                </p>
                <form onSubmit={handleSubmitBid}>
                    <BidFormFields formData={formData} onChange={handleFormChange} />
                    <button type="submit" className="btn bid-panel__submit-btn w-100 mt-3" disabled={submitting}>
                        {submitting
                            ? <span className="spinner-border spinner-border-sm me-2" />
                            : <FaPaperPlane size={13} className="me-2" />
                        }
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                    </button>
                </form>

                {job.active_bid_count > 0 && (
                    <div className="bid-competition-note mt-3">
                        <FaUsers size={13} className="me-1" />
                        {job.active_bid_count} handyman{job.active_bid_count > 1 ? 's' : ''} already bidding
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
        <div className="find-job-container bg-light py-4" style={{ minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '960px' }}>
                <button
                    className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center gap-2"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Back to list
                </button>

                <div className="row g-4">
                    {/* ── Left Column ── */}
                    <div className="col-12 col-lg-8">

                        {/* Main Job Card */}
                        <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="small fw-medium" style={{ color: '#94a3b8' }}>{jobCode}</span>
                                    <span style={{ color: '#cbd5e1' }}>•</span>
                                    <span className="small fw-medium" style={{ color: '#64748b' }}>{job.Service?.name || 'General Service'}</span>
                                </div>
                                <span className={`job-status-badge ${STATUS_BADGE_CLASS[job.current_status] || ''}`}>
                                    {STATUS_TEXT[job.current_status] || 'Status Updated'}
                                </span>
                            </div>

                            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                                {job.service_address && (
                                    <div className="detail-item d-flex align-items-center">
                                        <FaMapMarkerAlt className="detail-icon" />
                                        <span className="detail-text">{job.service_address}</span>
                                    </div>
                                )}
                                {job.distance_km !== null && job.distance_km !== undefined && (
                                    <div className="detail-item d-flex align-items-center">
                                        <FaLocationArrow className="detail-icon" size={12} />
                                        <span className="detail-text">{job.distance_km} km away</span>
                                    </div>
                                )}
                                <div className="detail-item d-flex align-items-center">
                                    <FaClock className="detail-icon" size={13} />
                                    <span className="detail-text">{getTimeAgo(job.createdAt)}</span>
                                </div>
                                {job.scheduled_at && (
                                    <div className="detail-item d-flex align-items-center">
                                        <FaCalendarAlt className="detail-icon" />
                                        <span className="detail-text">{formatDateTime(job.scheduled_at)}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-secondary mb-4" style={{ lineHeight: '1.75', whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                                {job.issue_description}
                            </p>

                            {job.images && job.images.length > 0 && (
                                <div className="d-flex gap-3 flex-wrap mb-4">
                                    {job.images.map((img, i) => (
                                        <img key={i} src={img} alt={`Attachment ${i + 1}`}
                                            className="rounded border"
                                            style={{ width: '90px', height: '90px', objectFit: 'cover', cursor: 'zoom-in' }}
                                            onClick={() => setLightboxSrc(img)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                <div className="d-flex align-items-center gap-2 text-secondary small">
                                    <FaMoneyBillWave size={14} />
                                    <span>Expected budget:</span>
                                </div>
                                <span className="fw-bold fs-6" style={{ color: '#ea580c' }}>{budgetDisplay}</span>
                            </div>
                        </div>

                        {/* Customer Card */}
                        {job.Customer && (
                            <div className="bg-white rounded-3 shadow-sm border p-4">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>Customer</h6>
                                <div className="d-flex align-items-center gap-3">
                                    {job.Customer.avatar_url ? (
                                        <img src={job.Customer.avatar_url} alt="Customer"
                                            className="rounded-circle flex-shrink-0"
                                            style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center fw-bold flex-shrink-0"
                                            style={{ width: '48px', height: '48px', fontSize: '18px', backgroundColor: '#f97316' }}>
                                            {job.Customer.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="fw-semibold mb-1" style={{ color: '#1e293b' }}>{job.Customer.full_name}</div>
                                        <div className="d-flex align-items-center gap-2 small text-secondary">
                                            {avgRating ? (
                                                <span className="d-flex align-items-center gap-1" style={{ color: '#f59e0b', fontWeight: 600 }}>
                                                    <FaStar size={12} /> {avgRating}
                                                </span>
                                            ) : (
                                                <span className="fst-italic text-muted">No ratings yet</span>
                                            )}
                                            <span>•</span>
                                            <span className="d-flex align-items-center gap-1">
                                                <FaPhone size={11} className="text-muted" />
                                                {canSeePhone && job.Customer.phone_number
                                                    ? <span className="fw-medium" style={{ color: '#1e293b' }}>{job.Customer.phone_number}</span>
                                                    : <span className="fst-italic">Hidden until accepted</span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column — Bid Panel ── */}
                    <div className="col-12 col-lg-4">
                        {renderBidPanel()}
                    </div>
                </div>
            </div>
        </div>

        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        </>
    );
};

// Shared form fields used in both submit & edit modes
const BidFormFields = ({ formData, onChange }) => (
    <>
        <div className="mb-3">
            <label className="bid-form-label">Proposed Price <span className="text-danger">*</span></label>
            <div className="input-group">
                <input
                    type="number"
                    name="proposed_price"
                    className="form-control bid-form-input"
                    placeholder="e.g. 350000"
                    value={formData.proposed_price}
                    onChange={onChange}
                    min="1"
                    required
                />
                <span className="input-group-text">đ</span>
            </div>
        </div>

        <div className="mb-3">
            <label className="bid-form-label">Arrival Time <span className="text-muted fw-normal">(optional)</span></label>
            <input
                type="datetime-local"
                name="eta"
                className="form-control bid-form-input"
                value={formData.eta}
                onChange={onChange}
            />
        </div>

        <div className="mb-3">
            <label className="bid-form-label">Est. Duration (hours) <span className="text-muted fw-normal">(optional)</span></label>
            <input
                type="number"
                name="estimated_duration_hours"
                className="form-control bid-form-input"
                placeholder="e.g. 2.5"
                value={formData.estimated_duration_hours}
                onChange={onChange}
                min="0.5"
                step="0.5"
            />
        </div>

        <div className="mb-0">
            <label className="bid-form-label">Note for Customer <span className="text-muted fw-normal">(optional)</span></label>
            <textarea
                name="message"
                className="form-control bid-form-input"
                rows={3}
                placeholder="Brief intro about your experience or approach..."
                value={formData.message}
                onChange={onChange}
            />
        </div>
    </>
);

export default HandymanJobDetailsPage;
