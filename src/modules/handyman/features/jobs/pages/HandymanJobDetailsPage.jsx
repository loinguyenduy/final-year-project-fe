import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetailsApi } from '../../../services/jobService';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaClock, FaPhone, FaStar } from 'react-icons/fa';
import '../styles/FindJob.scss';

const STATUS_TEXT = {
    POSTED: 'Looking for Handyman',
    BIDDING: 'Accepting Bids',
    ACCEPTED: 'Assigned',
    EN_ROUTE: 'En Route',
    ARRIVED: 'Arrived',
    IN_PROGRESS: 'In Progress',
    WARRANTY: 'Warranty',
    CLOSED: 'Completed',
};

const STATUS_BADGE_CLASS = {
    POSTED: 'posted',
    BIDDING: 'bidding',
    ACCEPTED: 'accepted',
    EN_ROUTE: 'enroute',
    ARRIVED: 'arrived',
    IN_PROGRESS: 'inprogress',
    WARRANTY: 'warranty',
    CLOSED: 'completed',
};

const HandymanJobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await getJobDetailsApi(id);
                if (res?.EC === 0) {
                    setJob(res.DT);
                } else {
                    toast.error(res?.EM || "Failed to load job details.");
                }
            } catch (err) {
                toast.error("Error fetching job details.");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

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
        const diffInMinutes = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hr ago`;
        return `${Math.floor(diffInHours / 24)} day(s) ago`;
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="spinner-border text-warning" role="status" />
        </div>
    );

    if (!job) return (
        <div className="text-center p-5 text-danger fw-bold">Job not found</div>
    );

    const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;
    const budgetDisplay = job.estimated_budget_min && job.estimated_budget_max
        ? `${formatCurrency(job.estimated_budget_min)} – ${formatCurrency(job.estimated_budget_max)}`
        : job.estimated_budget_max
            ? formatCurrency(job.estimated_budget_max)
            : 'Negotiable';

    const avgRating = parseFloat(job.Customer?.avg_rating) || 0;
    const canSeePhone = !['POSTED', 'BIDDING'].includes(job.current_status);
    const scheduledDisplay = formatDateTime(job.scheduled_at);

    return (
        <div className="find-job-container bg-light py-4" style={{ minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <button
                    className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center gap-2"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Back to list
                </button>

                <div className="row g-4">
                    {/* Left Column — job info + customer */}
                    <div className="col-12 col-lg-8">

                        {/* Main Job Card */}
                        <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
                            {/* Header row */}
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="small fw-medium" style={{ color: '#94a3b8' }}>{jobCode}</span>
                                    <span style={{ color: '#cbd5e1' }}>•</span>
                                    <span className="small fw-medium" style={{ color: '#64748b' }}>{job.Service?.name || 'General Service'}</span>
                                </div>
                                <span className={`job-status-badge ${STATUS_BADGE_CLASS[job.current_status] || ''}`}>
                                    {STATUS_TEXT[job.current_status] || job.current_status}
                                </span>
                            </div>

                            {/* Detail chips: address, posted time, scheduled date */}
                            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                                {job.service_address && (
                                    <div className="detail-item d-flex align-items-center">
                                        <FaMapMarkerAlt className="detail-icon" />
                                        <span className="detail-text">{job.service_address}</span>
                                    </div>
                                )}
                                <div className="detail-item d-flex align-items-center">
                                    <FaClock className="detail-icon" size={13} />
                                    <span className="detail-text">{getTimeAgo(job.createdAt)}</span>
                                </div>
                                {scheduledDisplay && (
                                    <div className="detail-item d-flex align-items-center">
                                        <FaCalendarAlt className="detail-icon" />
                                        <span className="detail-text">{scheduledDisplay}</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-secondary mb-4" style={{ lineHeight: '1.75', whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                                {job.issue_description}
                            </p>

                            {/* Attachment images */}
                            {job.images && job.images.length > 0 && (
                                <div className="d-flex gap-3 flex-wrap mb-4">
                                    {job.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            alt={`Attachment ${i + 1}`}
                                            className="rounded border"
                                            style={{ width: '90px', height: '90px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Budget row */}
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
                                        <img
                                            src={job.Customer.avatar_url}
                                            alt="Customer"
                                            className="rounded-circle flex-shrink-0"
                                            style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-circle text-white d-flex justify-content-center align-items-center fw-bold flex-shrink-0"
                                            style={{ width: '48px', height: '48px', fontSize: '18px', backgroundColor: '#f97316' }}
                                        >
                                            {job.Customer.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="fw-semibold mb-1" style={{ color: '#1e293b' }}>{job.Customer.full_name}</div>
                                        <div className="d-flex align-items-center gap-2 small text-secondary">
                                            {avgRating > 0 ? (
                                                <span className="d-flex align-items-center gap-1" style={{ color: '#f59e0b', fontWeight: 600 }}>
                                                    <FaStar size={12} /> {avgRating.toFixed(1)}
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

                    {/* Right Column — reserved for bidding feature */}
                    <div className="col-12 col-lg-4">
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HandymanJobDetailsPage;
