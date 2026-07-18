import React, { useEffect, useMemo, useState } from 'react';
import LifecycleModal from '../components/LifecycleModal';
import {
  formatCurrency,
  getCancellationPreview,
  getCancellationReasonOptions,
} from '../utils/jobLifecycleUi';

const LifecycleCancellationModal = ({ depositAmount, onClose, onSubmit, open, phase, role, submitting }) => {
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  useEffect(() => {
    if (open) {
      setReason('');
      setReasonText('');
    }
  }, [open]);
  const options = useMemo(() => getCancellationReasonOptions(role, phase), [phase, role]);
  const preview = useMemo(() => getCancellationPreview({
    role, phase, reason, depositAmount,
  }), [depositAmount, phase, reason, role]);
  const selected = options.find((option) => option.value === reason);
  const invalid = !reason || (reason === 'OTHER' && !reasonText.trim());
  const submit = async () => {
    const response = await onSubmit({ reason, reason_text: reasonText.trim() || null });
    if (response) onClose();
  };
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title="Cancellation options"
      titleId="lifecycle-cancellation-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onClose} disabled={submitting}>Back</button>
          <button type="button" className="lifecycle-btn lifecycle-btn--danger" onClick={submit} disabled={submitting || invalid}>
            {submitting && <span className="spinner-border spinner-border-sm" />}
            {selected?.mode === 'MUTUAL'
              ? 'Send cancellation request'
              : selected?.mode === 'REVIEW'
                ? 'Request review'
                : 'Cancel job'}
          </button>
        </>
      )}
    >
      <p>Select the most accurate reason. The backend confirms the final policy and financial result.</p>
      <fieldset className="lifecycle-radio-group">
        <legend>Cancellation reason</legend>
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="cancellation-reason"
              value={option.value}
              checked={reason === option.value}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {reason && (
        <label className="lifecycle-field">
          <span>Additional details {reason === 'OTHER' && <strong aria-hidden="true">*</strong>}</span>
          <textarea
            rows="4"
            maxLength="500"
            value={reasonText}
            onChange={(event) => setReasonText(event.target.value)}
            placeholder="Optional unless you selected another reason…"
          />
          <small>{reasonText.length}/500</small>
        </label>
      )}
      {preview && (
        <div className={`lifecycle-cancellation-preview lifecycle-cancellation-preview--${preview.mode.toLowerCase()}`}>
          <strong>Estimated result</strong>
          <p>{preview.message}</p>
          {preview.customerAmount != null && (
            <dl>
              <div><dt>Customer receives</dt><dd>{formatCurrency(preview.customerAmount)} ({preview.customerPercent}%)</dd></div>
              <div><dt>Handyman receives</dt><dd>{formatCurrency(preview.handymanAmount)} ({preview.handymanPercent}%)</dd></div>
            </dl>
          )}
        </div>
      )}
    </LifecycleModal>
  );
};

export default LifecycleCancellationModal;
