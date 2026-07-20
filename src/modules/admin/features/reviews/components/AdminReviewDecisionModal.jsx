import React, { useEffect, useId, useState } from 'react';
import AdminModal from '../../../components/AdminModal';

const REASONS = {
  APPROVE_REWORK: ['DEFECT_CONFIRMED', 'WORK_NOT_AS_AGREED_CONFIRMED', 'WARRANTY_OBLIGATION_CONFIRMED', 'OTHER'],
  REJECT_CLAIM: ['CLAIM_NOT_SUPPORTED', 'OUTSIDE_WARRANTY_SCOPE', 'INSUFFICIENT_EVIDENCE', 'CUSTOMER_MISUSE', 'OTHER'],
  ALLOW_ANOTHER_REWORK: ['REWORK_INCOMPLETE_BUT_REMEDIABLE', 'ADDITIONAL_CORRECTION_REQUIRED', 'INSUFFICIENT_REWORK_EVIDENCE', 'OTHER'],
  RELEASE_WARRANTY_RESERVE: ['REWORK_ACCEPTABLE', 'CUSTOMER_REJECTION_NOT_SUPPORTED', 'WARRANTY_OBLIGATION_FULFILLED', 'OTHER'],
  REFUND_WARRANTY_RESERVE: ['REWORK_FAILED', 'HANDYMAN_NONCOMPLIANCE', 'WARRANTY_OBLIGATION_NOT_FULFILLED', 'OTHER'],
  RESOLVE_CANCELLATION_CUSTOMER_FAULT: ['CUSTOMER_UNAVAILABLE', 'CUSTOMER_REFUSED_ACCESS', 'CUSTOMER_SCOPE_OR_ADDRESS_FAULT', 'CUSTOMER_REQUEST_UNSUPPORTED', 'OTHER'],
  RESOLVE_CANCELLATION_HANDYMAN_FAULT: ['HANDYMAN_NO_SHOW_OR_DELAY', 'HANDYMAN_NON_PERFORMANCE', 'HANDYMAN_UNPROFESSIONAL', 'HANDYMAN_REQUEST_UNSUPPORTED', 'OTHER'],
  RESOLVE_CANCELLATION_NEUTRAL: ['MUTUAL_OR_EXTERNAL_CAUSE', 'EVIDENCE_INCONCLUSIVE', 'NO_PARTY_AT_FAULT', 'OTHER']
};

const label = (value) => value.toLowerCase().split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

const AdminReviewDecisionModal = ({ open, action, requiresText, impact, submitting, error, onClose, onSubmit }) => {
  const titleId = useId();
  const errorId = useId();
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (open) { setReasonCode(''); setReasonText(''); }
  }, [action, open]);

  if (!action) return null;
  const textRequired = requiresText || reasonCode === 'OTHER';
  const invalid = !reasonCode || (textRequired && !reasonText.trim()) || reasonText.length > 500;
  return (
    <AdminModal open={open} titleId={titleId} onClose={onClose} submitting={submitting} className="review-decision-modal">
      <form onSubmit={(event) => { event.preventDefault(); if (!invalid) onSubmit({ reason_code: reasonCode, reason_text: reasonText.trim() || null }); }}>
        <h2 id={titleId}>{label(action)}</h2>
        <p className="decision-impact">{impact}</p>
        <label>Reason code
          <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} required aria-describedby={error ? errorId : undefined}>
            <option value="">Select a reason</option>
            {(REASONS[action] || []).map((reason) => <option key={reason} value={reason}>{label(reason)}</option>)}
          </select>
        </label>
        <label>Reason note {textRequired ? '(required)' : '(optional)'}
          <textarea value={reasonText} maxLength={500} onChange={(event) => setReasonText(event.target.value)} required={textRequired} rows={5} />
          <span className="character-count">{reasonText.length}/500</span>
        </label>
        {error && <p id={errorId} className="decision-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" disabled={submitting || invalid}>{submitting ? 'Submitting...' : 'Confirm decision'}</button></div>
      </form>
    </AdminModal>
  );
};

export default AdminReviewDecisionModal;
