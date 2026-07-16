import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { formatDateTime } from '../utils/jobLifecycleUi';

const STATUS_CONTENT = Object.freeze({
  ACCEPTED: {
    label: 'Accepted',
    title: {
      CUSTOMER: 'Your handyman is assigned',
      HANDYMAN: 'You were selected for this job',
    },
    description: 'The deposit is secured and the job workspace is ready for both participants.',
  },
  EN_ROUTE: {
    label: 'En route',
    title: {
      CUSTOMER: 'Your handyman is on the way',
      HANDYMAN: 'You are travelling to the service location',
    },
    description: 'Distance and ETA are snapshots recorded when the journey started.',
  },
  ARRIVED: {
    label: 'Arrived',
    title: {
      CUSTOMER: 'The handyman has arrived',
      HANDYMAN: 'Your arrival was confirmed',
    },
    description: 'Chat remains available while both parties prepare for the on-site assessment.',
  },
  QUOTE_PENDING: {
    label: 'Quote pending',
    title: {
      CUSTOMER: 'The final Quote is ready for review',
      HANDYMAN: 'Your final Quote was submitted',
    },
    description: 'Inspection evidence and the canonical saved Quote are now locked for review.',
  },
  CANCELLATION_REVIEW: {
    label: 'Cancellation review',
    title: {
      CUSTOMER: 'A cancellation request is being reviewed',
      HANDYMAN: 'A cancellation request is being reviewed',
    },
    description: 'The job is not cancelled yet. The deposit remains held and chat stays active.',
  },
});

const LifecycleHeader = ({ job, role, socketState, onBack }) => {
  const content = STATUS_CONTENT[job.status] || STATUS_CONTENT.ACCEPTED;
  const jobCode = `JOB-${job.id.slice(0, 4).toUpperCase()}`;
  const socketConnected = socketState === 'connected';

  return (
    <header className="lifecycle-header">
      <div className="lifecycle-header__top-row">
        <button type="button" className="lifecycle-back" onClick={onBack}>
          <FaArrowLeft aria-hidden="true" />
          Back to jobs
        </button>
        <span className={`lifecycle-status lifecycle-status--${job.status.toLowerCase()}`}>
          {content.label}
        </span>
      </div>

      <div className="lifecycle-header__meta">
        <span>{jobCode}</span>
        <span aria-hidden="true">•</span>
        <span>{job.service?.name || 'General service'}</span>
      </div>

      <div className="lifecycle-header__title-row">
        <div>
          <h1>{content.title[role] || content.title.CUSTOMER}</h1>
          <p>{content.description}</p>
        </div>
      </div>

      <div className="lifecycle-header__footer">
        <span className={`lifecycle-connection lifecycle-connection--${socketState}`}>
          {socketConnected ? 'Live updates connected' : 'Reconnecting live updates'}
        </span>
        {job.status === 'ARRIVED' && job.arrived_at && (
          <span>Confirmed {formatDateTime(job.arrived_at)}</span>
        )}
        {job.status === 'QUOTE_PENDING' && (
          <span>Inspection and Quote submitted</span>
        )}
      </div>
    </header>
  );
};

export default LifecycleHeader;
