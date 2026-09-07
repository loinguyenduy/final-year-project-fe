import React, { useState } from 'react';
import { FaPhoneAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getRoleLabel } from '../utils/jobLifecycleUi';
import ParticipantAvatar from '../../../../identity/components/ParticipantAvatar';
import ParticipantPublicProfileModal from '../../../../identity/components/ParticipantPublicProfileModal';
import { formatRating } from '../../../../identity/utils/participantDisplay';

const LifecyclePartnerSection = ({ children, partner }) => {
  const [profileOpen, setProfileOpen] = useState(false);
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
      <button type="button" className="lifecycle-partner__identity lifecycle-partner__identity-button" onClick={() => setProfileOpen(true)} disabled={!partner?.id} aria-label={`Open ${partner?.full_name || 'participant'} public profile`}>
        <ParticipantAvatar name={partner?.full_name} src={partner?.avatar_url} role={partner?.role} />
        <div>
          <h2 id="lifecycle-partner-title">{partner?.full_name || 'Job partner'}</h2>
          <p>{getRoleLabel(partner?.role)}</p>
        </div>
      </button>

      <div className="lifecycle-partner__metrics">
        <span><FaStar aria-hidden="true" /> {formatRating(partner?.rating_summary)}</span>
        <span>{partner?.review_count || 0} reviews</span>
        {partner?.completion_rate != null && <span>{partner.completion_rate}% completion</span>}
      </div>

      <div className="lifecycle-partner__actions">
        {children}
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
      {profileOpen && <ParticipantPublicProfileModal participantId={partner.id} onClose={() => setProfileOpen(false)} />}
    </section>
  );
};

export default LifecyclePartnerSection;
