import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaMapMarkerAlt, FaClipboardList, FaPlus } from 'react-icons/fa';
import { getCustomerJobsApi } from '../../../services/jobService';
import { getJobDetailsPath } from '../../../../matchmaking/features/job-lifecycle/utils/jobLifecycleNavigation';
import '../styles/MyJobs.scss';
import usePreLifecycleRealtime from '../../../../matchmaking/hooks/usePreLifecycleRealtime';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';

const CustomerMyJobsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const accessToken = useSelector((state) => state.identity.token);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const activeTab = searchParams.get('view') || 'ALL';
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await getCustomerJobsApi({ view: activeTab, sort: searchParams.get('sort') || 'UPDATED_DESC', page: searchParams.get('page') || 1, page_size: 20 });
            if (res && res.EC === 0) {
                const items = res.DT?.items || [];
                setFilteredJobs(items);
                setPagination(res.DT?.pagination || null);
            } else {
                toast.error(res.EM || "Failed to load jobs");
            }
        } catch (error) {
            console.error("Error fetching jobs: ", error);
            toast.error("Error loading jobs list");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, searchParams]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    usePreLifecycleRealtime({
        accessToken,
        onInvalidate: () => fetchJobs(),
    });

    const selectView = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value === 'ALL') next.delete('view');
        else next.set('view', value);
        next.set('page', '1');
        setSearchParams(next);
    };

    const selectSort = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value === 'UPDATED_DESC') next.delete('sort');
        else next.set('sort', value);
        next.set('page', '1');
        setSearchParams(next);
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const getStatusDetails = (status) => {
        switch (status) {
            case 'POSTED':
                return { text: 'Posted', className: 'status-posted' };
            case 'BIDDING':
                return { text: 'Bidding', className: 'status-bidding' };
            case 'PENDING_DEPOSIT':
                return { text: 'Deposit Pending', className: 'status-bidding' };
            case 'ACCEPTED':
                return { text: 'Accepted', className: 'status-accepted' };
            case 'EN_ROUTE':
                return { text: 'En Route', className: 'status-enroute' };
            case 'ARRIVED':
                return { text: 'Arrived', className: 'status-arrived' };
            case 'CANCELLATION_REVIEW':
                return { text: 'Cancellation Review', className: 'status-default' };
            case 'QUOTE_PENDING':
                return { text: 'Quote Pending', className: 'status-default' };
            case 'PAYMENT_PENDING':
                return { text: 'Payment Pending', className: 'status-default' };
            case 'IN_PROGRESS':
                return { text: 'In Progress', className: 'status-inprogress' };
            case 'CANCELLED':
                return { text: 'Cancelled', className: 'status-default' };
            case 'WARRANTY':
                return { text: 'In Warranty', className: 'status-warranty' };
            case 'CLOSED':
                return { text: 'Completed', className: 'status-completed' };
            default:
                return { text: 'Status Updated', className: 'status-default' };
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="my-jobs-container py-2">
            {/* Header section */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="title-text fw-bold m-0 text-slate-800">My Jobs</h2>
                    <p className="subtitle-text text-muted m-0 mt-1">Manage and track all your repair requests</p>
                </div>
                <button 
                    onClick={() => navigate('/customer/ai-diagnosis')} 
                    className="btn btn-primary fw-bold btn-add-job d-flex align-items-center gap-2 px-4 py-2"
                >
                    <FaPlus size={14} />
                    <span>Post New Request</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="my-jobs-controls mb-4">
              <div className="custom-tabs-container">
                <div className="custom-tabs">
                    {['ALL', 'NEEDS_ACTION', 'ACTIVE', 'CLOSED', 'CANCELLED'].map((view) => (
                        <button key={view} className={`tab-btn ${activeTab === view ? 'active' : ''}`} onClick={() => selectView(view)}>
                            {{ ALL: 'All', NEEDS_ACTION: 'Needs Action', ACTIVE: 'Active', CLOSED: 'Completed', CANCELLED: 'Cancelled' }[view]}{activeTab === view && pagination ? ` (${pagination.total_items})` : ''}
                        </button>
                    ))}
                </div>
              </div>
              <label className="my-jobs-sort">Sort
                <select value={searchParams.get('sort') || 'UPDATED_DESC'} onChange={(event) => selectSort(event.target.value)}>
                  <option value="UPDATED_DESC">Recently updated</option>
                  <option value="SCHEDULED_ASC">Scheduled soonest</option>
                  <option value="CREATED_DESC">Newest</option>
                </select>
              </label>
            </div>

            {/* Jobs Grid List */}
            {filteredJobs.length === 0 ? (
                <div className="empty-jobs-card text-center py-5">
                    <FaClipboardList className="empty-icon text-muted mb-3" size={60} />
                    <h5 className="fw-bold">No jobs found</h5>
                    <p className="text-muted">There are no job postings in this category.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredJobs.map((job) => {
                        const statusObj = getStatusDetails(job.current_status);
                        const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;
                        return (
                            <div key={job.id} className="col-md-6 col-lg-6">
                                <div className="job-item-card">
                                    {/* Card Top: Code, Service & Status Badge */}
                                    <div className="card-top d-flex justify-content-between align-items-start mb-3">
                                        <div className="job-meta">
                                            <span className="job-code fw-semibold">{jobCode}</span>
                                            <span className="meta-separator">•</span>
                                            <span className="job-service-name text-muted">{job.Service?.name || 'General Repair'}</span>
                                        </div>
                                        <span className={`status-badge ${statusObj.className}`}>
                                            {statusObj.text}
                                        </span>
                                    </div>

                                    {/* Job Title & Issue Description */}
                                    <div className="job-info mb-3">
                                        <h5 className="job-title fw-bold text-slate-800 mb-2">
                                            {job.Service?.name || 'General Handyman Service'}
                                        </h5>
                                        <p className="job-desc text-muted mb-0 text-truncate-2">
                                            {job.issue_description}
                                        </p>
                                    </div>

                                    {/* Service Details (Address & Date) */}
                                    <div className="job-details mb-3">
                                        <div className="detail-item d-flex align-items-center mb-2">
                                            <FaMapMarkerAlt className="detail-icon text-slate-400 me-2" />
                                            <span className="detail-text text-truncate">{job.service_address}</span>
                                        </div>
                                        <div className="detail-item d-flex align-items-center">
                                            <FaCalendarAlt className="detail-icon text-slate-400 me-2" />
                                            <span className="detail-text">
                                                {new Date(job.scheduled_at).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Handyman Assigned and Pricing Section */}
                                    {/* If no SelectedHandyman and no final_agreed_price, leave this section BLANK as per user instructions */}
                                    {(job.SelectedHandyman || job.final_agreed_price) && (
                                        <div className="card-bottom d-flex justify-content-between align-items-center pt-3 border-top mt-3">
                                            {/* Handyman details */}
                                            {job.SelectedHandyman ? (
                                                <div className="handyman-info d-flex align-items-center">
                                                    <ParticipantAvatar name={job.SelectedHandyman.full_name} src={job.SelectedHandyman.avatar_url} role="HANDYMAN" size="small" className="me-2" />
                                                    <div className="handyman-meta">
                                                        <h6 className="handyman-name fw-bold m-0 text-slate-700">
                                                            {job.SelectedHandyman.full_name}
                                                        </h6>
                                                        <small className="text-success-light fw-semibold">Handyman Assigned</small>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div></div>
                                            )}

                                            {/* Final price */}
                                            {job.final_agreed_price ? (
                                                <div className="job-price text-end">
                                                    <span className="price-label text-muted d-block small">Cost</span>
                                                    <span className="price-val fw-bold text-slate-800">
                                                        {formatCurrency(job.final_agreed_price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div></div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="mt-3 text-end">
                                        <button 
                                            className="btn btn-outline-primary btn-sm px-4 fw-bold shadow-sm"
                                            onClick={() => navigate(getJobDetailsPath({
                                                jobId: job.id,
                                                status: job.current_status,
                                                role: 'CUSTOMER',
                                            }))}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {pagination?.total_pages > 1 && (
                <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="My Jobs pages">
                    <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(pagination.page - 1)); setSearchParams(next); }}>Previous</button>
                    <span>Page {pagination.page} of {pagination.total_pages}</span>
                    <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page >= pagination.total_pages} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(pagination.page + 1)); setSearchParams(next); }}>Next</button>
                </nav>
            )}
        </div>
    );
};

export default CustomerMyJobsPage;
