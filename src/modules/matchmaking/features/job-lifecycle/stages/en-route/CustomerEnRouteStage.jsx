import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import {
  formatAccuracy,
  formatDateTime,
  formatDistance,
  getLocationWarning,
} from '../../utils/jobLifecycleUi';
import JourneyMetrics from './JourneyMetrics';

const CustomerEnRouteStage = ({
  allowedActions,
  enRoute,
  isCancelling,
  isConfirmingArrival,
  isRejectingArrival,
  onCancel,
  onConfirmArrival,
  onRejectArrival,
  request,
}) => {
  const pendingArrival = request?.status === 'PENDING'
    && allowedActions.includes('CONFIRM_ARRIVAL')
    && allowedActions.includes('REJECT_ARRIVAL');
  const previousRequestRejected = request?.status === 'REJECTED';
  const warning = getLocationWarning(request?.location_warning);

  return (
    <section className="lifecycle-stage" aria-labelledby="customer-en-route-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon" aria-hidden="true"><FaMapMarkerAlt /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">En route</span>
          <h2 id="customer-en-route-title">
            {pendingArrival ? 'The handyman reports they have arrived' : 'The handyman is on the way'}
          </h2>
          <p>
            {pendingArrival
              ? 'Check the service location before confirming the request.'
              : 'These estimates are a departure snapshot, not live tracking.'}
          </p>
        </div>
      </div>

      {pendingArrival ? (
        <>
          <dl className="lifecycle-request-facts">
            <div>
              <dt>Requested</dt>
              <dd>{formatDateTime(request?.requested_at)}</dd>
            </div>
            <div>
              <dt>Recorded distance</dt>
              <dd>{formatDistance(request?.distance_to_job_meters)}</dd>
            </div>
            {request?.gps_accuracy_meters != null && (
              <div>
                <dt>Location accuracy</dt>
                <dd>{formatAccuracy(request.gps_accuracy_meters)}</dd>
              </div>
            )}
          </dl>

          <div className={`lifecycle-notice lifecycle-notice--${warning.tone}`}>
            <strong>{warning.title}</strong>
            <span>{warning.message}</span>
          </div>

          <div className="lifecycle-stage__primary-bar lifecycle-stage__primary-bar--split">
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--primary"
              onClick={onConfirmArrival}
              disabled={isConfirmingArrival || isRejectingArrival}
            >
              Confirm arrival
            </button>
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--secondary"
              onClick={onRejectArrival}
              disabled={isConfirmingArrival || isRejectingArrival}
            >
              The handyman has not arrived
            </button>
          </div>
        </>
      ) : (
        <>
          <JourneyMetrics enRoute={enRoute} />
          {previousRequestRejected && (
            <div className="lifecycle-notice lifecycle-notice--warning">
              <strong>You did not confirm the previous arrival request.</strong>
              <span>
                The job remains En route. The handyman may try again after the current cooldown or review policy.
              </span>
            </div>
          )}
        </>
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

export default CustomerEnRouteStage;
