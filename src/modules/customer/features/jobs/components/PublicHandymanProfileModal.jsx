import { useEffect, useState } from 'react';
import { FaTimes, FaStar, FaCheckCircle, FaBriefcase } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPublicHandymanProfileApi } from '../../../services/jobService';
import '../styles/CustomerJobsComponents.scss';

const PublicHandymanProfileModal = ({ jobId, handymanId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    let active = true;
    getPublicHandymanProfileApi(jobId, handymanId).then((response) => { if (active) setProfile(response.DT); }).catch((error) => { toast.error(error?.EM || 'Unable to load this profile.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId, handymanId]);
  if (!handymanId) return null;
  const rating = profile?.rating_summary;
  return <div className="customer-modal-overlay" onClick={onClose}><div className="customer-modal-content profile-modal" role="dialog" aria-modal="true" aria-labelledby="public-profile-title" onClick={(event) => event.stopPropagation()}>
    <div className="modal-header"><div className="modal-heading"><span className="modal-kicker"><FaBriefcase /> Public work profile</span><h3 id="public-profile-title">Handyman Profile</h3><p>Public professional details without contact, Wallet or location data.</p></div><button className="close-btn" onClick={onClose} aria-label="Close profile"><FaTimes /></button></div>
    <div className="modal-body">{loading ? <div className="text-center p-5" role="status">Loading profile…</div> : profile ? <><div className="profile-header-section"><div className="profile-placeholder">{profile.display_name?.charAt(0)}</div><div className="profile-title"><h4>{profile.display_name}</h4><div className="profile-meta-tags"><span className="tag rating"><FaStar /> {rating?.rating_status === 'AVAILABLE' ? rating.bayesian_rating : rating?.rating_status === 'INSUFFICIENT_PRIOR_SAMPLE' ? 'Developing' : 'New'}</span><span className="tag kyc"><FaCheckCircle /> {profile.trust?.kyc_status}{profile.trust?.handyman_level ? ` / ${profile.trust.handyman_level}` : ''}</span></div></div></div>
      <div className="profile-stats-grid"><div className="stat-box"><div className="stat-value">{profile.closed_job_count}</div><div className="stat-label">Closed Jobs</div></div><div className="stat-box"><div className="stat-value">{rating?.review_count || 0}</div><div className="stat-label">Verified Reviews</div></div></div>
      {profile.bio && <div className="profile-section"><h5>About</h5><p>{profile.bio}</p></div>}{profile.services?.length > 0 && <div className="profile-section"><h5>Services</h5><div className="skills-list">{profile.services.map((service) => <span key={service.id} className="skill-tag"><FaBriefcase />{service.name}</span>)}</div></div>}
      <Link className="btn btn-primary" to={`/participants/${handymanId}/profile`}>View reviews and full public profile</Link></> : <div className="text-center p-5 text-danger">Profile not found.</div>}</div>
  </div></div>;
};

export default PublicHandymanProfileModal;
