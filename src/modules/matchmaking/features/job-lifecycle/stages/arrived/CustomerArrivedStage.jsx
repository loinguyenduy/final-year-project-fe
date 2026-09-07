import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const CustomerArrivedStage = ({
  allowedActions,
  arrivedAt,
  isCancelling,
  onCancel,
}) => (
  <section className="lifecycle-stage" aria-labelledby="customer-arrived-stage-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true">
        <FaCheckCircle />
      </span>
      <div>
        <span className="lifecycle-stage__eyebrow">Arrived</span>
        <h2 id="customer-arrived-stage-title">On-site inspection is in progress</h2>
        <p>
          The Handyman can document the inspection and prepare a final Quote.
          You will see the photos and Quote only after submission.
        </p>
      </div>
    </div>

    <dl className="lifecycle-request-facts lifecycle-request-facts--single">
      <div>
        <dt>Arrival confirmed</dt>
        <dd>{formatDateTime(arrivedAt)}</dd>
      </div>
    </dl>

    <div className="lifecycle-notice lifecycle-notice--neutral">
      <strong>Waiting for the final Quote</strong>
      <span>
        Draft inspection data is private to the selected Handyman until the Quote is submitted.
      </span>
    </div>

    {allowedActions.includes('REQUEST_CANCELLATION') && (
      <div className="lifecycle-stage__exception">
        <span>Can’t continue with this Job?</span>
        <button type="button" onClick={onCancel} disabled={isCancelling}>
          View cancellation options
        </button>
      </div>
    )}
  </section>
);

export default CustomerArrivedStage;
