import React from 'react';
import { FaClock, FaRoute, FaStopwatch } from 'react-icons/fa';
import {
  formatAccuracy,
  formatDateTime,
  formatDistance,
  formatEta,
} from '../../utils/jobLifecycleUi';

const JourneyMetrics = ({ enRoute, showAccuracy = false }) => (
  <>
    <div className="lifecycle-metrics">
      <div>
        <FaClock aria-hidden="true" />
        <span>Started</span>
        <strong>{formatDateTime(enRoute?.started_at)}</strong>
      </div>
      <div>
        <FaRoute aria-hidden="true" />
        <span>Estimated distance</span>
        <strong>{formatDistance(enRoute?.distance_meters)}</strong>
      </div>
      <div>
        <FaStopwatch aria-hidden="true" />
        <span>Estimated arrival</span>
        <strong>{formatEta(enRoute?.estimated_arrival_minutes)}</strong>
      </div>
    </div>

    {showAccuracy && enRoute?.gps_accuracy_meters != null && (
      <p className="lifecycle-stage__helper">
        Location accuracy at departure: {formatAccuracy(enRoute.gps_accuracy_meters)}
      </p>
    )}

    {enRoute?.distance_meters == null && (
      <div className="lifecycle-notice lifecycle-notice--neutral">
        Distance and ETA are unavailable because this job does not have a confirmed map location.
        The job can continue normally.
      </div>
    )}
  </>
);

export default JourneyMetrics;
