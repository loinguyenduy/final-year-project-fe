import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getMyBidsApi } from '../../../services/jobService';
import { toast } from 'react-toastify';
import { FaArrowRight, FaClipboardList, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import {
    getJobDetailsPath,
    isLifecycleWorkspaceStatus,
} from '../../../../matchmaking/features/job-lifecycle/utils/jobLifecycleNavigation';
import '../styles/FindJob.scss';
import usePreLifecycleRealtime from '../../../../matchmaking/hooks/usePreLifecycleRealtime';

const STATUS_TEXT = {
    POSTED: 'Looking for Handyman',
    BIDDING: 'Accepting Bids',
    PENDING_DEPOSIT: 'Deposit Pending',
    ACCEPTED: 'Assigned',
    EN_ROUTE: 'En Route',
    ARRIVED: 'Arrived',
    CANCELLATION_REVIEW: 'Cancellation Review',
    QUOTE_PENDING: 'Quote Pending',
    PAYMENT_PENDING: 'Payment Pending',
    IN_PROGRESS: 'In Progress',
    WARRANTY: 'Warranty',
    CLOSED: 'Completed',
    CANCELLED: 'Cancelled',
};

const BID_STATUS_CONFIG = {
    PENDING: { label: 'Pending', className: 'bid-status-badge--pending' },
    WON:     { label: 'Won',     className: 'bid-status-badge--won' },
    LOST:    { label: 'Not Selected', className: 'bid-status-badge--lost' },
    WITHDRAWN: { label: 'Withdrawn', className: 'bid-status-badge--lost' },
    CANCELLED_BY_CUSTOMER: { label: 'Selection Cancelled', className: 'bid-status-badge--lost' },
    CANCELLED_BY_HANDYMAN: { label: 'Withdrawn', className: 'bid-status-badge--lost' },
};

const HandymanMyJobsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const accessToken = useSelector((state) => state.identity.token);
    const [bids, setBids] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyBids = async () => {
            try {
                const res = await getMyBidsApi({ view: searchParams.get('view') || 'ALL', sort: searchParams.get('sort') || 'UPDATED_DESC', page: searchParams.get('page') || 1, page_size: 20 });
                if (res?.EC === 0) {
                    setBids(res.DT?.items || []);
                    setPagination(res.DT?.pagination || null);
                } else {
                    toast.error(res?.EM || "Failed to load your bids.");
                }
            } catch {
                toast.error("Error loading bids.");
            } finally {
                setLoading(false);
            }
        };
        fetchMyBids();
    }, [searchParams]);

    usePreLifecycleRealtime({
        accessToken,
        onInvalidate: async () => {
            try {
                const res = await getMyBidsApi({ view: searchParams.get('view') || 'ALL', sort: searchParams.get('sort') || 'UPDATED_DESC', page: searchParams.get('page') || 1, page_size: 20 });
                if (res?.EC === 0) {
                    setBids(res.DT?.items || []);
                    setPagination(res.DT?.pagination || null);
                }
            } catch {
                // Keep the last canonical list visible until the next reconnect or manual visit.
            }
        },
    });

    const formatCurrency = (val) => {
        if (!val) return '—';
        return `${new Intl.NumberFormat('en-US').format(val)} VND`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Flexible';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
            <div className="spinner-border text-warning" role="status" />
        </div>
    );

    return (
        <div className="find-job-container py-4" style={{ minHeight: '100vh' }}>
            <div className="container">
                <div className="mb-4">
                    <h2 className="title-text fw-bold m-0">My Jobs</h2>
                    <p className="subtitle-text text-muted m-0 mt-1">Track your bids and active jobs in one place</p>
                </div>
                <div className="d-flex gap-2 flex-wrap mb-4" aria-label="My Jobs filters">
                    {['ALL', 'BIDDING', 'ASSIGNED', 'NEEDS_ACTION', 'CLOSED', 'CANCELLED'].map((view) => <button key={view} type="button" className={`btn btn-sm ${searchParams.get('view') === view || (!searchParams.get('view') && view === 'ALL') ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={() => setSearchParams(view === 'ALL' ? {} : { view, page: '1' })}>{view.replace('_', ' ')}</button>)}
                </div>

                {bids.length === 0 ? (
                    <div className="empty-jobs-card text-center py-5">
                        <FaClipboardList className="text-muted mb-3" size={56} />
                        <h5 className="fw-bold">No bids yet</h5>
                        <p className="text-muted">Find a job and submit your first bid to get started.</p>
                        <button className="btn btn-apply fw-semibold mt-2" onClick={() => navigate('/handyman/find-jobs')}>
                            Browse Jobs <FaArrowRight className="ms-1" size={13} />
                        </button>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {bids.map((bid) => {
                            const job = bid.Job;
                            const bidConfig = BID_STATUS_CONFIG[bid.status]
                                || { label: 'Updated', className: '' };
                            const jobCode = job ? `JOB-${job.id.substring(0, 4).toUpperCase()}` : '—';

                            return (
                                <div key={bid.id} className="my-bid-card">
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">

                                        {/* Left: Job info */}
                                        <div className="flex-grow-1 min-w-0">
                                            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                                <span className="small fw-medium" style={{ color: '#94a3b8' }}>{jobCode}</span>
                                                <span style={{ color: '#cbd5e1' }}>•</span>
                                                <span className="small fw-semibold" style={{ color: '#64748b' }}>
                                                    {job?.Service?.name || 'General Service'}
                                                </span>
                                                <span className={`bid-status-badge ${bidConfig.className}`}>
                                                    {bidConfig.label}
                                                </span>
                                            </div>

                                            <div className="d-flex flex-wrap gap-3 small text-secondary mb-2">
                                                {job?.service_address && (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <FaMapMarkerAlt size={12} className="text-muted" />
                                                        <span>{job.service_address}</span>
                                                    </div>
                                                )}
                                                <div className="d-flex align-items-center gap-1">
                                                    <FaCalendarAlt size={12} className="text-muted" />
                                                    <span>{formatDate(job?.scheduled_at)}</span>
                                                </div>
                                            </div>

                                            {/* Job status pill */}
                                            <span className="my-bid-job-status">
                                                Job: {STATUS_TEXT[job?.current_status] || 'Status updated'}
                                            </span>
                                        </div>

                                        {/* Right: Bid price + action */}
                                        <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                                            <div className="text-end">
                                                <div className="small text-muted mb-1">Your bid</div>
                                                <div className="my-bid-price fw-bold">
                                                    {formatCurrency(bid.proposed_price)}
                                                </div>
                                                {job?.estimated_budget_max && (
                                                    <div className="small text-muted">
                                                        Budget: {formatCurrency(job.estimated_budget_max)}
                                                    </div>
                                                )}
                                            </div>
                                            {job && (
                                                <button
                                                    className="btn btn-apply btn-sm fw-semibold"
                                                    onClick={() => navigate(
                                                        bid.status === 'WON'
                                                            && isLifecycleWorkspaceStatus(job.current_status)
                                                            ? getJobDetailsPath({
                                                                jobId: job.id,
                                                                status: job.current_status,
                                                                role: 'HANDYMAN',
                                                            })
                                                            : `/handyman/jobs/${job.id}`,
                                                    )}
                                                >
                                                    View Job <FaArrowRight className="ms-1" size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {bid.message && (
                                        <div className="my-bid-message mt-3">
                                            <span className="my-bid-message-label">Your note: </span>
                                            <span className="my-bid-message-text">{bid.message}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {pagination?.total_pages > 1 && (
                    <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="My Jobs pages">
                        <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => setSearchParams({ view: searchParams.get('view') || 'ALL', page: String(pagination.page - 1) })}>Previous</button>
                        <span>Page {pagination.page} of {pagination.total_pages}</span>
                        <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page >= pagination.total_pages} onClick={() => setSearchParams({ view: searchParams.get('view') || 'ALL', page: String(pagination.page + 1) })}>Next</button>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default HandymanMyJobsPage;
