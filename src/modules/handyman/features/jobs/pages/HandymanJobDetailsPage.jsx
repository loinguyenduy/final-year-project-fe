import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetailsApi } from '../../../services/jobService';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaClock, FaTools, FaUser, FaCheckCircle } from 'react-icons/fa';

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

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
    if (!job) return <div className="text-center p-5 text-danger">Job not found</div>;

    return (
        <div className="container py-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>&larr; Back</button>
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom pb-3 pt-4">
                    <h4 className="mb-0 text-primary"><FaTools className="me-2" /> {job.Service?.name || 'Unknown Service'}</h4>
                    <span className={`badge bg-${job.current_status === 'POSTED' ? 'warning text-dark' : 'success'} mt-2 fs-6`}>
                        {job.current_status}
                    </span>
                </div>
                <div className="card-body">
                    <h5 className="fw-bold mb-3">Description</h5>
                    <p className="text-muted bg-light p-3 rounded">{job.issue_description}</p>
                    
                    <div className="row mt-4">
                        <div className="col-md-6 mb-3">
                            <h6 className="fw-bold"><FaMapMarkerAlt className="text-danger me-2" /> Location</h6>
                            <p className="text-muted">{job.service_address}</p>
                        </div>
                        <div className="col-md-6 mb-3">
                            <h6 className="fw-bold"><FaCalendarAlt className="text-primary me-2" /> Schedule</h6>
                            <p className="text-muted">{new Date(job.scheduled_at).toLocaleString()}</p>
                        </div>
                        <div className="col-md-6 mb-3">
                            <h6 className="fw-bold"><FaMoneyBillWave className="text-success me-2" /> Budget Range</h6>
                            <p className="text-muted">
                                {job.estimated_budget_min ? `${Number(job.estimated_budget_min).toLocaleString()} đ` : '0 đ'} 
                                 - 
                                {job.estimated_budget_max ? `${Number(job.estimated_budget_max).toLocaleString()} đ` : 'Any'}
                            </p>
                        </div>
                        <div className="col-md-6 mb-3">
                            <h6 className="fw-bold"><FaClock className="text-warning me-2" /> Posted At</h6>
                            <p className="text-muted">{new Date(job.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    {job.images && job.images.length > 0 && (
                        <div className="mt-4">
                            <h6 className="fw-bold">Job Photos</h6>
                            <div className="d-flex gap-2 flex-wrap mt-2">
                                {job.images.map((img, i) => (
                                    <img key={i} src={img} alt={`Job Image ${i}`} className="rounded shadow-sm" style={{width: 150, height: 150, objectFit: 'cover'}} />
                                ))}
                            </div>
                        </div>
                    )}

                    {job.Customer && (
                        <div className="mt-4 p-3 bg-light rounded border border-secondary">
                            <h6 className="fw-bold text-secondary"><FaUser className="me-2" /> Customer Info</h6>
                            <div className="d-flex align-items-center mt-2">
                                <img src={job.Customer.avatar_url || 'https://via.placeholder.com/50'} alt="Customer" className="rounded-circle me-3" style={{width: 50, height: 50, objectFit: 'cover'}} />
                                <div>
                                    <p className="mb-0 fw-bold">{job.Customer.full_name}</p>
                                    <p className="mb-0 text-muted">{job.Customer.phone_number || 'Hidden'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {job.current_status === 'POSTED' && (
                        <div className="mt-4">
                            <button className="btn btn-success fw-bold px-4 py-2"><FaCheckCircle className="me-2" /> Bid on this Job</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HandymanJobDetailsPage;
