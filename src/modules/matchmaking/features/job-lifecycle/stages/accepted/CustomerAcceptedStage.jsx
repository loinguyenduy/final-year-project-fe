import React from 'react';
import { FaCheckCircle, FaSearch } from 'react-icons/fa';

const CustomerAcceptedStage = ({
  allowedActions,
  isCancelling,
  onCancel,
  onReopen,
}) => (
  <section className="lifecycle-stage" aria-labelledby="customer-accepted-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon" aria-hidden="true"><FaCheckCircle /></span>
      <div>
        <span className="lifecycle-stage__eyebrow">Accepted</span>
        <h2 id="customer-accepted-title">The handyman has accepted your job</h2>
        <p>You will receive a live update when the handyman starts travelling to the service location.</p>
      </div>
    </div>

    <div className="lifecycle-notice lifecycle-notice--success">
      Your deposit remains held securely. Use chat if you need to coordinate before departure.
    </div>

    {allowedActions.includes('REOPEN_BIDDING') && (
      <div className="lifecycle-stage__secondary-actions">
        <button
          type="button"
          className="lifecycle-btn lifecycle-btn--secondary"
          onClick={onReopen}
          disabled={isCancelling}
        >
          <FaSearch aria-hidden="true" />
          Find another handyman
        </button>
      </div>
    )}

    {allowedActions.includes('CANCEL_JOB') && (
      <div className="lifecycle-stage__exception">
        <span>Can’t continue with this job?</span>
        <button type="button" onClick={onCancel} disabled={isCancelling}>
          View cancellation options
        </button>
      </div>
    )}
  </section>
);

export default CustomerAcceptedStage;
