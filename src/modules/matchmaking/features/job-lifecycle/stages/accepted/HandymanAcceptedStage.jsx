import React from 'react';
import { FaLocationArrow } from 'react-icons/fa';

const HandymanAcceptedStage = ({
  allowedActions,
  isCancelling,
  isStartingMoving,
  onCancel,
  onStartMoving,
}) => (
  <section className="lifecycle-stage" aria-labelledby="handyman-accepted-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon" aria-hidden="true"><FaLocationArrow /></span>
      <div>
        <span className="lifecycle-stage__eyebrow">Accepted</span>
        <h2 id="handyman-accepted-title">Ready to travel to the service location?</h2>
        <p>Your current location will be used to calculate a one-time distance and ETA snapshot.</p>
      </div>
    </div>

    <p className="lifecycle-stage__helper">
      Your browser will request fresh location permission after you confirm. Raw coordinates are not shown in the workspace.
    </p>

    {allowedActions.includes('START_MOVING') && (
      <div className="lifecycle-stage__primary-bar">
        <button
          type="button"
          className="lifecycle-btn lifecycle-btn--primary"
          onClick={onStartMoving}
          disabled={isStartingMoving}
        >
          <FaLocationArrow aria-hidden="true" />
          Start moving
        </button>
      </div>
    )}

    {allowedActions.includes('CANCEL_ACCEPTED_JOB') && (
      <div className="lifecycle-stage__exception">
        <span>Can’t continue with this job?</span>
        <button type="button" onClick={onCancel} disabled={isCancelling}>
          View cancellation options
        </button>
      </div>
    )}
  </section>
);

export default HandymanAcceptedStage;
