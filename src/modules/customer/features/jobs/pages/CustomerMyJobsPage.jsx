import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaMapMarkerAlt, FaUserCheck, FaDollarSign, FaInfoCircle, FaClipboardList, FaPlus } from 'react-icons/fa';
import { getCustomerJobsApi } from '../../../services/jobService';
import '../styles/MyJobs.scss';

const CustomerMyJobsPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await getCustomerJobsApi();
            if (res && res.EC === 0) {
                setJobs(res.DT);
                setFilteredJobs(res.DT);
            } else {
                toast.error(res.EM || "Failed to load jobs");
            }
        } catch (error) {
            console.error("Error fetching jobs: ", error);
            toast.error("Error loading jobs list");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Filter jobs based on active tab
    useEffect(() => {
        if (activeTab === 'ALL') {
            setFilteredJobs(jobs);
        } else if (activeTab === 'ACTIVE') {
            // Active includes POSTED, BIDDING, ACCEPTED, EN_ROUTE, ARRIVED, IN_PROGRESS
            const activeStatuses = ['POSTED', 'BIDDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];
            setFilteredJobs(jobs.filter(job => activeStatuses.includes(job.current_status)));
        } else if (activeTab === 'WARRANTY') {
            setFilteredJobs(jobs.filter(job => job.current_status === 'WARRANTY'));
        } else if (activeTab === 'COMPLETED') {
            setFilteredJobs(jobs.filter(job => job.current_status === 'CLOSED'));
        }
    }, [activeTab, jobs]);

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const getStatusDetails = (status) => {
        switch (status) {
            case 'POSTED':
            case 'BIDDING':
                return { text: 'Bidding', className: 'status-bidding' };
            case 'ACCEPTED':
            case 'EN_ROUTE':
            case 'ARRIVED':
            case 'IN_PROGRESS':
                return { text: 'In Progress', className: 'status-inprogress' };
            case 'WARRANTY':
                return { text: 'In Warranty', className: 'status-warranty' };
            case 'CLOSED':
                return { text: 'Completed', className: 'status-completed' };
            default:
                return { text: status, className: 'status-default' };
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
            <div className="custom-tabs-container mb-4">
                <div className="custom-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ALL')}
                    >
                        All ({jobs.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ACTIVE')}
                    >
                        Active ({jobs.filter(j => ['POSTED', 'BIDDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(j.current_status)).length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'WARRANTY' ? 'active' : ''}`}
                        onClick={() => setActiveTab('WARRANTY')}
                    >
                        Warranty ({jobs.filter(j => j.current_status === 'WARRANTY').length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
                        onClick={() => setActiveTab('COMPLETED')}
                    >
                        Completed ({jobs.filter(j => j.current_status === 'CLOSED').length})
                    </button>
                </div>
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
                                                    <div className="handyman-avatar me-2">
                                                        {job.SelectedHandyman.avatar_url ? (
                                                            <img 
                                                                src={job.SelectedHandyman.avatar_url} 
                                                                alt={job.SelectedHandyman.full_name} 
                                                                className="avatar-img" 
                                                            />
                                                        ) : (
                                                            <span className="avatar-placeholder">
                                                                {job.SelectedHandyman.full_name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomerMyJobsPage;
