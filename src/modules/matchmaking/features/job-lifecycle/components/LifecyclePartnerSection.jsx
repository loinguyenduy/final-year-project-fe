import React from 'react';
import { FaPhoneAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getRoleLabel } from '../utils/jobLifecycleUi';
import { Link } from 'react-router-dom';

const LifecyclePartnerSection = ({ children, partner }) => {
  const copyPhone = async () => {
    if (!partner?.phone_number) return;
    try {
      await navigator.clipboard.writeText(partner.phone_number);
      toast.success('Phone number copied.');
    } catch {
      toast.error('The phone number could not be copied.');
    }
  };

  return (
    <section className="lifecycle-partner" aria-labelledby="lifecycle-partner-title">
      <span className="lifecycle-context-label">Job partner</span>
      <div className="lifecycle-partner__identity">
        {partner?.avatar_url ? (
          <img
            src={partner.avatar_url}
            alt={`${partner.full_name || 'Job partner'} avatar`}
            className="lifecycle-partner__avatar"
          />
        ) : (
          <span className="lifecycle-partner__avatar lifecycle-partner__avatar--placeholder" aria-hidden="true">
            {partner?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        )}
        <div>
          <h2 id="lifecycle-partner-title">{partner?.full_name || 'Job partner'}</h2>
          <p>{getRoleLabel(partner?.role)}</p>
        </div>
      </div>

      <div className="lifecycle-partner__metrics">
        <span><FaStar aria-hidden="true" /> {partner?.rating_summary?.rating_status === 'AVAILABLE' ? partner.rating_summary.bayesian_rating : partner?.rating_summary?.rating_status === 'INSUFFICIENT_PRIOR_SAMPLE' ? 'Developing' : 'New'}</span>
        <span>{partner?.review_count || 0} reviews</span>
        {partner?.completion_rate != null && <span>{partner.completion_rate}% completion</span>}
      </div>

      <div className="lifecycle-partner__actions">
        {children}
        {partner?.id && <Link className="lifecycle-btn lifecycle-btn--secondary lifecycle-btn--compact" to={`/participants/${partner.id}/profile`}>View profile</Link>}
        {partner?.phone_number && (
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--secondary lifecycle-btn--compact"
            onClick={copyPhone}
          >
            <FaPhoneAlt aria-hidden="true" />
            Call
          </button>
        )}
      </div>
    </section>
  );
};

export default LifecyclePartnerSection;
