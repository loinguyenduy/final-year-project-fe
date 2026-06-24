import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetailsApi } from '../../../services/jobService';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaCheckCircle } from 'react-icons/fa';
import '../../../../customer/features/jobs/styles/JobDetails.scss';

const HandymanJobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await getJobDetailsApi(id);
                if (res && res.EC === 0) {
                    setJob(res.DT);
                } else {
                    toast.error(res.EM || "Failed to load job details.");
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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'TBD';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'POSTED': return 'status-posted';
            case 'BIDDING': return 'status-bidding';
            case 'ACCEPTED': return 'status-accepted';
            case 'EN_ROUTE': return 'status-enroute';
            case 'ARRIVED': return 'status-arrived';
            case 'IN_PROGRESS': return 'status-inprogress';
            case 'WARRANTY': return 'status-warranty';
            case 'CLOSED': return 'status-completed';
            default: return 'status-default';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'POSTED': return 'Posted';
            case 'BIDDING': return 'Bidding';
            case 'ACCEPTED': return 'Accepted';
            case 'EN_ROUTE': return 'En Route';
            case 'ARRIVED': return 'Arrived';
            case 'IN_PROGRESS': return 'In Progress';
            case 'WARRANTY': return 'Warranty';
            case 'CLOSED': return 'Completed';
            default: return status;
        }
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
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
    const bidCount = job.Bids ? job.Bids.length : 0;
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

            {/* PROGRESS CARD */}
            <div className="progress-card">
                <h4 className="card-title">Job Progress</h4>
                <div className="progress-steps-container">
                    {steps.map((step, idx) => {
                        let stepClass = '';
                        if (idx < currentStepIdx) {
                            stepClass = 'completed';
                        } else if (idx === currentStepIdx) {
                            stepClass = 'active';
                        }

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

            {/* DETAILS CARD */}
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
                        <span className="info-label">Applied Handymen</span>
                        <span className="info-value highlight">{bidCount} Handymen</span>
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
                        <span className="info-label">Deposit Status (10%)</span>
                        <span className="info-value">
                            {job.final_agreed_price ? 'Deposited' : 'Not Deposited'}
                        </span>
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
                                <img key={i} src={img} alt={`Job Image ${i}`} className="gallery-img" onClick={() => window.open(img, '_blank')} />
                            ))}
                        </div>
                    </>
                )}

                {job.Customer && (
                    <>
                        <h5 className="section-title">Customer Info</h5>
                        <div className="customer-card">
                            {job.Customer.avatar_url ? (
                                <img src={job.Customer.avatar_url} alt="Customer" className="avatar" />
                            ) : (
                                <div className="placeholder-avatar">
                                    {job.Customer.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="user-details">
                                <span className="name">{job.Customer.full_name}</span>
                                <span className="role-tag">Customer</span>
                                <span className="phone">{job.Customer.phone_number || 'Hidden'}</span>
                            </div>
                        </div>
                    </>
                )}

                {(job.current_status === 'POSTED' || job.current_status === 'BIDDING') && (
                    <div className="mt-4">
                        <button className="btn btn-success fw-bold px-4 py-2"><FaCheckCircle className="me-2" /> Bid on this Job</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandymanJobDetailsPage;
