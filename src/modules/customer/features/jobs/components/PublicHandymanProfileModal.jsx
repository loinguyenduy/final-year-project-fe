import React, { useEffect, useState } from 'react';
import { FaTimes, FaStar, FaCheckCircle, FaBriefcase, FaUserTie } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getPublicHandymanProfileApi } from '../../../services/jobService';
import '../styles/CustomerJobsComponents.scss';

const PublicHandymanProfileModal = ({ jobId, handymanId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await getPublicHandymanProfileApi(jobId, handymanId);
                if (res && res.EC === 0) {
                    setProfile(res.DT);
                } else {
                    toast.error(res.EM || "Failed to load public profile.");
                    onClose();
                }
            } catch {
                toast.error("Error fetching public profile.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (jobId && handymanId) {
            fetchProfile();
        }
    }, [jobId, handymanId, onClose]);

    if (!jobId || !handymanId) return null;

    return (
        <div className="customer-modal-overlay" onClick={onClose}>
            <div className="customer-modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-heading">
                        <span className="modal-kicker"><FaUserTie /> Public work profile</span>
                        <h3>Handyman Profile</h3>
                        <p>Review work history, skills, and customer feedback without exposing private contact details.</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="modal-body">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" />
                            <p className="mt-3 text-muted">Loading handyman profile...</p>
                        </div>
                    ) : profile ? (
                        <>
                            {/* Profile Header */}
                            <div className="profile-header-section">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="profile-avatar" />
                                ) : (
                                    <div className="profile-placeholder">
                                        {profile.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="profile-title">
                                    <h4>{profile.full_name}</h4>
                                    <div className="profile-meta-tags">
                                        <span className="tag rating">
                                            <FaStar /> {profile.bayesian_score?.toFixed(1) || '0.0'}
                                        </span>
                                        {profile.handyman_level && (
                                            <span className="tag kyc">
                                                <FaCheckCircle /> {profile.kyc_status || 'UNVERIFIED'} / {profile.handyman_level}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Key Stats */}
                            <div className="profile-stats-grid">
                                <div className="stat-box">
                                    <div className="stat-value">{profile.total_jobs_completed || 0}</div>
                                    <div className="stat-label">Completed Jobs</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{profile.success_rate || 0}%</div>
                                    <div className="stat-label">Success Rate</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{profile.reviews?.length || 0}</div>
                                    <div className="stat-label">Reviews</div>
                                </div>
                            </div>

                            {/* About Me */}
                            {profile.about_me && (
                                <div className="profile-section">
                                    <h5>About</h5>
                                    <div className="bio-text">
                                        {profile.about_me}
                                    </div>
                                </div>
                            )}

                            {/* Expertise & Skills */}
                            {profile.expertise_and_skills?.length > 0 && (
                                <div className="profile-section">
                                    <h5>Expertise & Skills</h5>
                                    <div className="skills-list">
                                        {profile.expertise_and_skills.map((skillItem) => (
                                            <span key={skillItem.id} className="skill-tag">
                                                {skillItem.Service?.icon_url ? (
                                                    <img src={skillItem.Service.icon_url} alt="icon" />
                                                ) : (
                                                    <FaBriefcase color="#94a3b8" />
                                                )}
                                                {skillItem.Service?.name || 'Unknown'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviews */}
                            {profile.reviews?.length > 0 && (
                                <div className="profile-section">
                                    <h5>Recent Reviews</h5>
                                    <div className="reviews-list">
                                        {profile.reviews.slice(0, 5).map((review) => (
                                            <div key={review.id} className="review-item">
                                                <div className="review-header">
                                                    <div className="reviewer-info">
                                                        {review.reviewer?.avatar_url ? (
                                                            <img src={review.reviewer.avatar_url} alt="reviewer" className="reviewer-avatar" />
                                                        ) : (
                                                            <FaCheckCircle color="#cbd5e1" size={24} />
                                                        )}
                                                        <span className="reviewer-name">{review.reviewer?.full_name || 'Customer'}</span>
                                                    </div>
                                                    <span className="review-date">
                                                        {new Date(review.created_at).toLocaleDateString('en-US')}
                                                    </span>
                                                </div>
                                                <div className="review-stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} color={i < review.rating_stars ? '#f59e0b' : '#e2e8f0'} />
                                                    ))}
                                                </div>
                                                <p className="review-comment">
                                                    {review.comment || "No written feedback."}
                                                </p>
                                                {review.service && (
                                                    <span className="review-service">
                                                        Job: {review.service.name}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-5 text-danger">Handyman profile not found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicHandymanProfileModal;
