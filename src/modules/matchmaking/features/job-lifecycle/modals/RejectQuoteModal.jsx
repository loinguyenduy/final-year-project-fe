import React, { useEffect, useMemo, useState } from 'react';
import LifecycleModal from '../components/LifecycleModal';
import {
  formatCurrency,
  getCancellationPreview,
} from '../utils/jobLifecycleUi';

const REASONS = Object.freeze([
  { value: 'FINAL_QUOTE_TOO_HIGH', label: 'The final Quote is too high' },
  { value: 'FINAL_QUOTE_NOT_ACCEPTABLE', label: 'The final Quote is not acceptable' },
]);

const RejectQuoteModal = ({
  depositAmount,
  onClose,
  onSubmit,
  open,
  submitting,
}) => {
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setReasonText('');
    }
  }, [open]);

  const preview = useMemo(() => getCancellationPreview({
    role: 'CUSTOMER',
    phase: 'QUOTE_PENDING',
    reason,
    depositAmount,
  }), [depositAmount, reason]);

  const submit = async () => {
    const response = await onSubmit({
      reason,
      reason_text: reasonText.trim() || null,
    });
    if (response) onClose();
  };

  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title="Reject final Quote?"
      titleId="reject-quote-title"
      footer={(
        <>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Continue reviewing
          </button>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--danger"
            onClick={submit}
            disabled={submitting || !reason}
          >
            {submitting ? 'Rejecting Quote...' : 'Reject Quote and cancel Job'}
          </button>
        </>
      )}
    >
      <div className="lifecycle-notice lifecycle-notice--danger">
        Rejecting the Quote immediately cancels the Job, closes Chat and resolves
        the held deposit under the Quote-rejection policy.
      </div>
      <fieldset className="lifecycle-radio-group">
        <legend>Reason</legend>
        {REASONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="quote-rejection-reason"
              value={option.value}
              checked={reason === option.value}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="lifecycle-field">
        <span>Additional details <em>Optional</em></span>
        <textarea
          rows="4"
          maxLength="500"
          value={reasonText}
          onChange={(event) => setReasonText(event.target.value)}
        />
        <small>{reasonText.length}/500</small>
      </label>
      {preview?.customerAmount != null && (
        <dl className="lifecycle-confirmation-summary">
          <div>
            <dt>Customer receives</dt>
            <dd>{formatCurrency(preview.customerAmount)} ({preview.customerPercent}%)</dd>
          </div>
          <div>
            <dt>Handyman receives</dt>
            <dd>{formatCurrency(preview.handymanAmount)} ({preview.handymanPercent}%)</dd>
          </div>
        </dl>
      )}
    </LifecycleModal>
  );
};

export default RejectQuoteModal;
