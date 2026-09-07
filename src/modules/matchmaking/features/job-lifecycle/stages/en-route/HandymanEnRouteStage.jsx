import React from 'react';
import { FaCheck, FaHourglassHalf, FaMapMarkerAlt } from 'react-icons/fa';
import {
  formatDateTime,
  formatDistance,
  getArrivalRejectionLabel,
  getLocationWarning,
} from '../../utils/jobLifecycleUi';
import JourneyMetrics from './JourneyMetrics';

const HandymanEnRouteStage = ({
  allowedActions,
  cooldownSeconds,
  enRoute,
  isCancelling,
  isRequestingArrival,
  onCancel,
  onRequestArrival,
  policy,
  request,
}) => {
  const waitingForConfirmation = request?.status === 'PENDING'
    && allowedActions.includes('WAIT_ARRIVAL_CONFIRMATION');
  const requestRejected = request?.status === 'REJECTED';
  const warning = getLocationWarning(request?.location_warning);

  return (
    <section className="lifecycle-stage" aria-labelledby="handyman-en-route-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon" aria-hidden="true"><FaMapMarkerAlt /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">En route</span>
          <h2 id="handyman-en-route-title">You are travelling to the service location</h2>
          <p>Use the arrival action only after you have reached the location.</p>
        </div>
      </div>

      <JourneyMetrics enRoute={enRoute} showAccuracy />

      {waitingForConfirmation && (
        <div className="lifecycle-arrival-state lifecycle-arrival-state--waiting">
          <FaHourglassHalf aria-hidden="true" />
          <div>
            <h3>Waiting for customer confirmation</h3>
            <p>The request was sent {formatDateTime(request?.requested_at)}.</p>
            <p>Recorded distance: {formatDistance(request?.distance_to_job_meters)}</p>
            <div className={`lifecycle-notice lifecycle-notice--${warning.tone}`}>
              <strong>{warning.title}</strong>
              <span>{warning.message}</span>
            </div>
          </div>
        </div>
      )}

      {requestRejected && (
        <div className="lifecycle-arrival-state lifecycle-arrival-state--rejected">
          <div>
            <h3>The customer did not confirm your arrival</h3>
            <p>{getArrivalRejectionLabel(request.rejection_reason)}</p>
            {request.rejection_reason_text && <blockquote>“{request.rejection_reason_text}”</blockquote>}
            <strong>
              Rejections in this cycle: {policy?.rejection_count || 0}/{policy?.max_rejections || 3}
            </strong>
            {cooldownSeconds > 0 && (
              <p className="lifecycle-countdown" aria-live="polite">
                You can send another request in {cooldownSeconds} seconds.
              </p>
            )}
          </div>
        </div>
      )}

      {allowedActions.includes('WAIT_ARRIVAL_REVIEW') && (
        <div className="lifecycle-notice lifecycle-notice--warning">
          <strong>Arrival review required</strong>
          <span>
            The rejection limit has been reached. Continue coordinating with the customer through chat.
          </span>
        </div>
      )}

      {allowedActions.includes('WAIT_ARRIVAL_COOLDOWN') && cooldownSeconds > 0 && (
        <div className="lifecycle-notice lifecycle-notice--neutral" aria-live="polite">
          Another arrival request will be available in {cooldownSeconds} seconds.
        </div>
      )}

      {allowedActions.includes('REQUEST_ARRIVAL') && (
        <div className="lifecycle-stage__primary-bar">
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            onClick={onRequestArrival}
            disabled={isRequestingArrival}
          >
            <FaCheck aria-hidden="true" />
            I have arrived
          </button>
        </div>
      )}

      {allowedActions.includes('REQUEST_CANCELLATION') && (
        <div className="lifecycle-stage__exception">
          <span>Can’t continue with this job?</span>
          <button type="button" onClick={onCancel} disabled={isCancelling}>
            View cancellation options
          </button>
        </div>
      )}
    </section>
  );
};

export default HandymanEnRouteStage;
