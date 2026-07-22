import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList, FaSortAmountDown, FaArrowRight, FaStar, FaClock, FaLocationArrow } from 'react-icons/fa';
import { getAvailableJobsApi, getServicesApi } from '../../../services/jobService';
import { getCachedLocation, setCachedLocation } from '../../../../../core/utils/locationCache';
import { getJobDetailsPath } from '../../../../matchmaking/features/job-lifecycle/utils/jobLifecycleNavigation';
import '../styles/FindJob.scss';

const HandymanFindJobPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [services, setServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isLoading, setIsLoading] = useState(true);
    const [gpsCoords, setGpsCoords] = useState({ lat: null, long: null });
    const [gpsEnabled, setGpsEnabled] = useState(false);

    useEffect(() => {
        // Apply cached coords immediately (zero-latency for returning users)
        const cached = getCachedLocation();
        if (cached) {
            setGpsCoords({ lat: cached.lat, long: cached.long });
            setGpsEnabled(true);
        }

        // Always request fresh GPS in the background to keep the cache current
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const long = pos.coords.longitude;
                    setGpsCoords({ lat, long });
                    setGpsEnabled(true);
                    setCachedLocation(lat, long);
                },
                () => {
                    // Only mark GPS as off if there were no cached coords to fall back on
                    if (!cached) setGpsEnabled(false);
                },
                { timeout: 8000, enableHighAccuracy: false }
            );
        }
    }, []);

    // Debounce: wait 350ms after user stops typing before triggering search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchServices = async () => {
        try {
            const res = await getServicesApi();
            if (res?.EC === 0) setServices(res.DT);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await getAvailableJobsApi(debouncedSearch, selectedServiceId, sortBy, gpsCoords.lat, gpsCoords.long);
            if (res?.EC === 0) {
                setJobs(res.DT);
            } else {
                toast.error(res?.EM || "Failed to load jobs");
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error("Error loading available jobs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchServices(); }, []);

    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, selectedServiceId, gpsCoords, debouncedSearch]);

    const handleSortChange = (newSort) => {
        if (newSort === 'distance' && !gpsEnabled) {
            toast.info("Please enable location access to use distance-based sorting.");
            return;
        }
        // Clicking the active sort (except 'newest') toggles it off back to 'newest'
        setSortBy(prev => (prev === newSort && newSort !== 'newest') ? 'newest' : newSort);
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
    };

    const formatBudget = (min, max) => {
        if (min && max) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
        if (max) return formatCurrency(max);
        return 'Negotiable';
    };

    const formatScheduled = (dateStr) => {
        if (!dateStr) return 'Flexible';
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} ${hour}:${min}`;
    };

    const getTimeAgo = (dateStr) => {
        const diffInMinutes = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hr ago`;
        return `${Math.floor(diffInHours / 24)} day(s) ago`;
    };

    const SORT_LABELS = {
        newest: 'Newest',
        distance: 'Nearest',
        budget_desc: 'Highest Budget',
        budget_asc: 'Lowest Budget',
    };

    return (
        <div className="find-job-container py-4">
            <div className="container">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="title-text fw-bold m-0">Find Jobs</h2>
                    <p className="subtitle-text text-muted m-0 mt-1">Browse available jobs that match your profile</p>
                </div>

                {/* Search + Sort joined in one row */}
                <div className="filter-section mb-3">
                    <div className="d-flex align-items-stretch mb-2">
                        <div className="position-relative flex-grow-1">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="form-control search-input search-joined w-100"
                                placeholder="Search jobs by description or service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="dropdown flex-shrink-0">
                            <button
                                className="btn sort-joined-btn d-flex align-items-center gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                            >
                                <FaSortAmountDown size={14} />
                                <span>{SORT_LABELS[sortBy]}</span>
                                {sortBy !== 'newest' && <span className="sort-active-dot" />}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                {Object.entries(SORT_LABELS).map(([key, label]) => (
                                    <li key={key}>
                                        <button
                                            className={`dropdown-item ${sortBy === key ? 'active' : ''}`}
                                            onClick={() => handleSortChange(key)}
                                        >
                                            {label}
                                            {key === 'distance' && !gpsEnabled && (
                                                <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>(GPS off)</span>
                                            )}
                                            {sortBy === key && key !== 'newest' && (
                                                <span className="ms-auto ps-3 text-muted" style={{ fontSize: '0.8rem' }}>✕ clear</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* GPS status */}
                    <div className={`gps-indicator d-inline-flex align-items-center gap-1 ${gpsEnabled ? 'gps-on' : 'gps-off'}`}>
                        <FaLocationArrow size={10} />
                        <span>{gpsEnabled ? 'Location On' : 'Location Off'}</span>
                    </div>
                </div>

                {/* Service Category Pills */}
                <div className="category-pills mb-4 d-flex gap-2 overflow-auto pb-2">
                    <button
                        className={`pill-btn ${selectedServiceId === '' ? 'active' : ''}`}
                        onClick={() => setSelectedServiceId('')}
                    >
                        All
                    </button>
                    {services.map(service => (
                        <button
                            key={service.id}
                            className={`pill-btn ${selectedServiceId === service.id ? 'active' : ''}`}
                            onClick={() => setSelectedServiceId(service.id)}
                        >
                            {service.name}
                        </button>
                    ))}
                </div>

                {/* Job List */}
                {isLoading ? (
                    <div className="d-flex justify-content-center py-5">
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="empty-jobs-card text-center py-5">
                        <FaClipboardList className="text-muted mb-3" size={60} />
                        <h5 className="fw-bold">No jobs found</h5>
                        <p className="text-muted">No jobs match your current search or profile criteria.</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {jobs.map((job) => {
                            const jobCode = `JOB-${job.id.substring(0, 4).toUpperCase()}`;
                            const avgRating = job.Customer?.rating_summary?.bayesian_rating || null;

                            return (
                                <div key={job.id} className="job-list-item-card">
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">

                                        {/* Left: Job Info */}
                                        <div className="job-content flex-grow-1 min-w-0">
                                            <div className="job-meta mb-2 d-flex align-items-center flex-wrap gap-2">
                                                <span className="job-code">{jobCode}</span>
                                                <span className="meta-dot">•</span>
                                                <span className="job-category">{job.Service?.name || 'General Service'}</span>
                                            </div>

                                            <h4 className="job-title mb-3 fw-bold">
                                                {job.issue_description}
                                            </h4>

                                            <div className="job-details d-flex flex-wrap align-items-center gap-3 mb-2">
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
                                                {job.distance_km !== null && (
                                                    <div className="detail-item d-flex align-items-center">
                                                        <FaLocationArrow className="detail-icon" size={12} />
                                                        <span className="detail-text">{job.distance_km} km</span>
                                                    </div>
                                                )}
                                                <div className="detail-item d-flex align-items-center">
                                                    <FaCalendarAlt className="detail-icon" />
                                                    <span className="detail-text">{formatScheduled(job.scheduled_at)}</span>
                                                </div>
                                            </div>

                                            <div className="customer-meta d-flex align-items-center gap-2">
                                                {avgRating ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <FaStar className="star-icon" size={13} />
                                                        <span className="star-value">{avgRating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="no-rating">No ratings yet</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Budget + Action */}
                                        <div className="job-action d-flex flex-column align-items-end justify-content-between flex-shrink-0" style={{ minWidth: '180px' }}>
                                            <div className="text-end">
                                                <div className="budget-value fw-bold">
                                                    {formatBudget(job.estimated_budget_min, job.estimated_budget_max)}
                                                </div>
                                                <div className="bidder-count">
                                                    {Number(job.active_bid_count) > 0
                                                        ? `${job.active_bid_count} bid${Number(job.active_bid_count) > 1 ? 's' : ''}`
                                                        : 'No bids yet'
                                                    }
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-apply fw-semibold mt-3"
                                                onClick={() => navigate(getJobDetailsPath({
                                                    jobId: job.id,
                                                    status: job.current_status,
                                                    role: 'HANDYMAN',
                                                }))}
                                            >
                                                View Details <FaArrowRight className="ms-1" size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandymanFindJobPage;
