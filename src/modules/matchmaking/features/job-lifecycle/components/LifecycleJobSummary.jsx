import React, { useState } from 'react';
import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { formatDateTime } from '../utils/jobLifecycleUi';

const LifecycleJobSummary = ({ job, onOpenImage }) => {
  const [expanded, setExpanded] = useState(false);
  const jobCode = `JOB-${job.id.slice(0, 4).toUpperCase()}`;

  return (
    <section className="lifecycle-job-details">
      <button
        type="button"
        className="lifecycle-job-details__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span>
          <small>Job details</small>
          <strong>{job.service?.name || 'General service'}</strong>
        </span>
        <span className="lifecycle-job-details__toggle-label">
          {expanded ? 'Hide details' : 'View details'}
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      <div className="lifecycle-job-details__facts">
        <div>
          <span>Job code</span>
          <strong>{jobCode}</strong>
        </div>
        <div>
          <span><FaMapMarkerAlt aria-hidden="true" /> Address</span>
          <strong>{job.service_address || 'Address not available'}</strong>
        </div>
        <div>
          <span><FaCalendarAlt aria-hidden="true" /> Schedule</span>
          <strong>{formatDateTime(job.scheduled_at, 'Flexible schedule')}</strong>
        </div>
      </div>

      {expanded && (
        <div className="lifecycle-job-details__expanded">
          <div>
            <span>Description</span>
            <p>{job.issue_description || 'No detailed description was provided.'}</p>
          </div>
          {Array.isArray(job.images) && job.images.length > 0 && (
            <div className="lifecycle-job-details__images">
              {job.images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => onOpenImage(image)}
                  aria-label={`Open job image ${index + 1}`}
                >
                  <img src={image} alt={`Job evidence ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LifecycleJobSummary;
