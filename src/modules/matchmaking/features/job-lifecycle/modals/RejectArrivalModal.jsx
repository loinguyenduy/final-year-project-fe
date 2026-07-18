import React, { useEffect, useState } from 'react';
import { ARRIVAL_REJECTION_OPTIONS } from '../utils/jobLifecycleUi';
import LifecycleModal from '../components/LifecycleModal';

const RejectArrivalModal = ({ onClose, onSubmit, open, submitting }) => {
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setReasonText('');
    setValidationError('');
  }, [open]);

  const submit = async () => {
    const trimmed = reasonText.trim();
    if (!reason) {
      setValidationError('Select a reason.');
      return;
    }
    if (reason === 'OTHER' && !trimmed) {
      setValidationError('Add a short note for another reason.');
      return;
    }
    const response = await onSubmit({ reason, reason_text: trimmed || null });
    if (response) onClose();
  };

  const invalid = !reason || (reason === 'OTHER' && !reasonText.trim());
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title="Has the handyman not arrived?"
      titleId="reject-arrival-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onClose} disabled={submitting}>Back</button>
          <button type="button" className="lifecycle-btn lifecycle-btn--danger" onClick={submit} disabled={submitting || invalid}>
            {submitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
            Confirm not arrived
          </button>
        </>
      )}
    >
      <div className="lifecycle-inline-notice lifecycle-inline-notice--warning">
        This only declines the current arrival request. The job stays En route, the deposit remains held, and chat stays active.
      </div>
      <fieldset className="lifecycle-radio-group">
        <legend>Reason</legend>
        {ARRIVAL_REJECTION_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="arrival-rejection-reason"
              value={option.value}
              checked={reason === option.value}
              onChange={(event) => {
                setReason(event.target.value);
                setValidationError('');
              }}
              disabled={submitting}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {reason === 'OTHER' && (
        <label className="lifecycle-field">
          <span>Short note <strong aria-hidden="true">*</strong></span>
          <textarea
            rows="4"
            maxLength="500"
            value={reasonText}
            onChange={(event) => setReasonText(event.target.value)}
            disabled={submitting}
            placeholder="Briefly describe what happened…"
          />
          <small>{reasonText.length}/500</small>
        </label>
      )}
      {validationError && <p className="lifecycle-validation-error" role="alert">{validationError}</p>}
    </LifecycleModal>
  );
};

export default RejectArrivalModal;
