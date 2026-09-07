import React, { useEffect, useMemo, useState } from 'react';
import LifecycleModal from '../components/LifecycleModal';

const REASONS = Object.freeze({
  CUSTOMER_REOPEN: [
    ['SELECTED_WRONG_HANDYMAN', 'Selected the wrong handyman'],
    ['HANDYMAN_NOT_SUITABLE', 'The handyman is not suitable'],
    ['SCHEDULE_CONFLICT', 'Schedule conflict'],
    ['CANNOT_CONTACT_HANDYMAN', 'Cannot contact the handyman'],
    ['JOB_INFORMATION_CHANGED', 'The job information changed'],
    ['OTHER', 'Another reason'],
  ],
  CUSTOMER_CANCEL: [
    ['NO_LONGER_NEEDED', 'The service is no longer needed'],
    ['SCHEDULE_CONFLICT', 'Schedule conflict'],
    ['JOB_INFORMATION_CHANGED', 'The job information changed'],
    ['OTHER', 'Another reason'],
  ],
  HANDYMAN: [
    ['SCHEDULE_CONFLICT', 'Schedule conflict'],
    ['OUTSIDE_EXPERTISE', 'The job is outside my expertise'],
    ['MISSING_REQUIRED_TOOLS', 'Required tools are unavailable'],
    ['CANNOT_REACH_LOCATION', 'Cannot reach the service location'],
    ['CANNOT_CONTACT_CUSTOMER', 'Cannot contact the customer'],
    ['PERSONAL_EMERGENCY', 'Personal emergency'],
    ['JOB_INFORMATION_INACCURATE', 'The job information is inaccurate'],
    ['OTHER', 'Another reason'],
  ],
});

const AcceptedCancellationModal = ({ actionType, onClose, onSubmit, open, role, submitting }) => {
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  useEffect(() => {
    if (open) {
      setReason('');
      setReasonText('');
    }
  }, [open]);
  const isCustomer = role === 'CUSTOMER';
  const isReopen = actionType === 'REOPEN_BIDDING';
  const reasons = useMemo(() => (
    isCustomer ? REASONS[isReopen ? 'CUSTOMER_REOPEN' : 'CUSTOMER_CANCEL'] : REASONS.HANDYMAN
  ), [isCustomer, isReopen]);
  const submit = async () => {
    const response = await onSubmit({
      ...(isCustomer ? { action: actionType } : {}),
      reason_code: reason,
      reason_text: reasonText.trim() || undefined,
    });
    if (response) onClose();
  };
  const invalid = !reason || (reason === 'OTHER' && !reasonText.trim());
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title={isReopen ? 'Find another handyman?' : isCustomer ? 'Cancel this job?' : 'Can’t continue this job?'}
      titleId="accepted-cancellation-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onClose} disabled={submitting}>Back</button>
          <button type="button" className="lifecycle-btn lifecycle-btn--danger" onClick={submit} disabled={submitting || invalid}>
            {submitting && <span className="spinner-border spinner-border-sm" />}
            Confirm
          </button>
        </>
      )}
    >
      <p>
        {isReopen
          ? 'The current selection will be removed and the job will return to Bidding.'
          : isCustomer
            ? 'The job will be cancelled and the deposit will be handled by the Accepted-stage policy.'
            : 'The job will return to Bidding and the deposit will be handled by the Accepted-stage policy.'}
      </p>
      <label className="lifecycle-field">
        <span>Reason</span>
        <select value={reason} onChange={(event) => setReason(event.target.value)} disabled={submitting}>
          <option value="">Select a reason…</option>
          {reasons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      {reason === 'OTHER' && (
        <label className="lifecycle-field">
          <span>Additional details</span>
          <textarea maxLength="1000" rows="4" value={reasonText} onChange={(event) => setReasonText(event.target.value)} />
          <small>{reasonText.length}/1000</small>
        </label>
      )}
    </LifecycleModal>
  );
};

export default AcceptedCancellationModal;
