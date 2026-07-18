import React from 'react';
import { FaBalanceScale, FaClock } from 'react-icons/fa';
import {
  formatCurrency,
  formatDateTime,
  getCancellationReasonLabel,
  getRoleLabel,
} from '../../utils/jobLifecycleUi';

const CancellationReviewStage = ({
  allowedActions,
  cancellation,
  isResponding,
  onConfirm,
  onReject,
  role,
}) => {
  const requestedByCurrentRole = cancellation?.requested_by_role === role;
  const awaitingCounterparty = cancellation?.status === 'AWAITING_COUNTERPARTY';
  const preview = cancellation?.financial_preview;

  return (
    <section className="lifecycle-stage" aria-labelledby="cancellation-review-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon lifecycle-stage__icon--warning" aria-hidden="true">
          <FaBalanceScale />
        </span>
        <div>
          <span className="lifecycle-stage__eyebrow">Cancellation review</span>
          <h2 id="cancellation-review-title">
            {awaitingCounterparty
              ? requestedByCurrentRole
                ? 'Waiting for the other participant'
                : 'You received a mutual cancellation request'
              : 'The cancellation request requires review'}
          </h2>
          <p>The job is not cancelled. The deposit remains held and chat stays active.</p>
        </div>
      </div>

      <dl className="lifecycle-request-facts">
        <div>
          <dt>Requested by</dt>
          <dd>{getRoleLabel(cancellation?.requested_by_role)}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{getCancellationReasonLabel(cancellation?.requested_by_role, cancellation?.reason)}</dd>
        </div>
        <div>
          <dt>Requested</dt>
          <dd>{formatDateTime(cancellation?.requested_at)}</dd>
        </div>
        <div>
          <dt>Deposit held</dt>
          <dd>{formatCurrency(preview?.deposit_amount)}</dd>
        </div>
      </dl>

      {cancellation?.reason_text && <blockquote>“{cancellation.reason_text}”</blockquote>}
      {cancellation?.counterparty_response_note && (
        <blockquote>Response: “{cancellation.counterparty_response_note}”</blockquote>
      )}

      {allowedActions.includes('WAIT_CANCELLATION_REVIEW') && (
        <div className="lifecycle-notice lifecycle-notice--warning">
          <FaClock aria-hidden="true" />
          <span>No participant action is available while this request is waiting for review.</span>
        </div>
      )}

      {(allowedActions.includes('CONFIRM_CANCELLATION')
        || allowedActions.includes('REJECT_CANCELLATION')) && (
        <div className="lifecycle-stage__primary-bar lifecycle-stage__primary-bar--split">
          {allowedActions.includes('CONFIRM_CANCELLATION') && (
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--danger"
              onClick={onConfirm}
              disabled={isResponding}
            >
              Confirm cancellation
            </button>
          )}
          {allowedActions.includes('REJECT_CANCELLATION') && (
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--secondary"
              onClick={onReject}
              disabled={isResponding}
            >
              Decline request
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default CancellationReviewStage;
