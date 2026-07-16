import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const ArrivedStage = ({
  allowedActions,
  arrivedAt,
  isCancelling,
  onCancel,
  role,
}) => (
  <section className="lifecycle-stage" aria-labelledby="arrived-stage-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true">
        <FaCheckCircle />
      </span>
      <div>
        <span className="lifecycle-stage__eyebrow">Arrived</span>
        <h2 id="arrived-stage-title">
          {role === 'CUSTOMER'
            ? 'The handyman has arrived at the service location'
            : 'The customer confirmed your arrival'}
        </h2>
        <p>
          {role === 'CUSTOMER'
            ? 'The handyman can now assess the job and prepare the next service step.'
            : 'You can now assess the job and coordinate the next service step with the customer.'}
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
      <strong>What happens next?</strong>
      <span>
        The role-specific Arrived workspace provides the available inspection and Quote actions.
      </span>
    </div>

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

export default ArrivedStage;
