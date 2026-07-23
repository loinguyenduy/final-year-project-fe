import { useEffect, useState } from 'react';
import { getParticipantInitials } from '../utils/participantDisplay';
import './ParticipantUi.scss';

const ParticipantAvatar = ({
  name,
  src,
  size = 'medium',
  role = 'CUSTOMER',
  className = '',
  decorative = false,
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const label = name ? `${name}'s avatar` : 'Participant avatar';
  return (
    <span
      className={`participant-avatar participant-avatar--${size} participant-avatar--${String(role).toLowerCase()} ${className}`}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {src && !failed
        ? <img src={src} alt="" onError={() => setFailed(true)} />
        : getParticipantInitials(name)}
    </span>
  );
};

export default ParticipantAvatar;
