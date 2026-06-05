import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList, FaFilter } from 'react-icons/fa';
import { getAvailableJobsApi, getServicesApi } from '../../../services/jobService';
import '../styles/FindJob.scss';

const HandymanFindJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [services, setServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchServices = async () => {
        try {
            const res = await getServicesApi();
            if (res && res.EC === 0) {
                setServices(res.DT);
            }
        } catch (error) {
            console.error("Error fetching services: ", error);
        }
    };

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await getAvailableJobsApi(searchQuery, selectedServiceId);
            if (res && res.EC === 0) {
                setJobs(res.DT);
            } else {
                toast.error(res.EM || "Failed to load jobs");
            }
        } catch (error) {
            console.error("Error fetching jobs: ", error);
            toast.error("Error loading available jobs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle search/filter application
    const handleApplyFilters = () => {
        fetchJobs();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleApplyFilters();
        }
    };

    if (isLoading && jobs.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="find-job-container py-2">
            {/* Header section */}
            <div className="mb-4">
                <h2 className="title-text fw-bold m-0 text-slate-800">Find Jobs</h2>
                <p className="subtitle-text text-muted m-0 mt-1">Discover and apply for available repair requests</p>
            </div>

            {/* Filter Section */}
            <div className="filter-section p-3 mb-4 d-flex flex-wrap gap-3 align-items-center">
                <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        className="form-control search-input w-100" 
                        placeholder="Search by job title or service name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                    <select 
                        className="form-select service-select w-100"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                        <option value="">All Services</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button 
                    className="btn btn-primary fw-bold d-flex align-items-center gap-2 px-4 py-2"
                    onClick={handleApplyFilters}
                >
                    <FaFilter size={14} />
                    <span>Filter</span>
                </button>
            </div>

            {/* Jobs Grid List */}
            {jobs.length === 0 ? (
                <div className="empty-jobs-card text-center py-5">
                    <FaClipboardList className="empty-icon text-muted mb-3" size={60} />
                    <h5 className="fw-bold">No jobs available</h5>
                    <p className="text-muted">There are no job postings matching your criteria.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {jobs.map((job) => {
                        const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;
                        return (
                            <div key={job.id} className="col-md-6 col-lg-6">
                                <div className="job-item-card">
                                    {/* Card Top: Code & Service */}
                                    <div className="card-top d-flex justify-content-between align-items-start mb-3">
                                        <div className="job-meta">
                                            <span className="job-code fw-semibold">{jobCode}</span>
                                            <span className="meta-separator">•</span>
                                            <span className="job-service-name text-muted">{job.Service?.name || 'General Repair'}</span>
                                        </div>
                                    </div>

                                    {/* Job Title & Issue Description */}
                                    <div className="job-info mb-3">
                                        <h5 className="job-title fw-bold text-slate-800 mb-2">
                                            {job.Service?.name || 'General Handyman Service'}
                                        </h5>
                                        <p className="job-desc text-muted mb-0">
                                            {job.issue_description}
                                        </p>
                                    </div>

                                    {/* Service Details (Address & Date) */}
                                    <div className="job-details mb-4">
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

                                    {/* Action Bottom */}
                                    <div className="card-bottom mt-auto d-flex justify-content-end border-top pt-3">
                                        <button className="btn-view-job fw-semibold">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HandymanFindJobPage;
