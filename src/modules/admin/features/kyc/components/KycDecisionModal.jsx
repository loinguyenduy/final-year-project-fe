import React, { useRef, useState } from 'react';
import AdminModal from '../../../components/AdminModal';
import { decideKycRequest } from '../../../services/adminKycService';

const REJECTION_REASONS = [
  ['DOCUMENT_UNCLEAR', 'Document is unclear'],
  ['DOCUMENT_EXPIRED', 'Document has expired'],
  ['INFORMATION_MISMATCH', 'Information does not match'],
  ['MISSING_REQUIRED_DOCUMENT', 'Required document is missing'],
  ['SUSPECTED_ALTERATION', 'Suspected document alteration'],
  ['FACE_OR_IDENTITY_MISMATCH', 'Face or identity mismatch'],
  ['OTHER', 'Other']
];

const KycDecisionModal = ({ decision, submission, onClose, onSuccess, onError }) => {
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const submittingRef = useRef(false);

  if (!decision || !submission) return null;
  const isReject = decision === 'REJECT';

  const submit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setValidationError('');
    if (isReject && !reasonCode) {
      setValidationError('Select a rejection reason.');
      return;
    }
    if (isReject && reasonCode === 'OTHER' && !reasonText.trim()) {
      setValidationError('A note is required when the reason is Other.');
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await decideKycRequest(submission.id, {
        decision,
        reason_code: isReject ? reasonCode : null,
        reason_text: isReject && reasonText.trim() ? reasonText.trim() : null
      });
      onSuccess(response);
    } catch (error) {
      onError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal open={Boolean(decision && submission)} titleId="decision-title" onClose={onClose} submitting={isSubmitting}>
        <div className="modal-heading">
          <div>
            <span className={`decision-kicker ${isReject ? 'reject' : 'approve'}`}>{isReject ? 'Reject request' : 'Approve request'}</span>
            <h2 id="decision-title">{isReject ? 'Reject KYC request?' : 'Approve KYC request?'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={isSubmitting} aria-label="Close dialog">X</button>
        </div>
        <p className="modal-impact">
          {isReject
            ? 'The participant may correct the issue and submit a new KYC request.'
            : "This will verify the participant's identity for the platform."}
        </p>
        <form onSubmit={submit}>
          {isReject && (
            <>
              <label htmlFor="rejection-code">Reason</label>
              <select
                id="rejection-code"
                value={reasonCode}
                onChange={(event) => {
                  setReasonCode(event.target.value);
                  setValidationError('');
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(validationError && !reasonCode)}
                aria-describedby={validationError ? 'decision-validation-error' : undefined}
              >
                <option value="">Select a reason</option>
                {REJECTION_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <div className="note-label"><label htmlFor="rejection-note">Additional note {reasonCode === 'OTHER' ? '(required)' : '(optional)'}</label><span>{reasonText.length}/500</span></div>
              <textarea
                id="rejection-note"
                value={reasonText}
                maxLength={500}
                onChange={(event) => {
                  setReasonText(event.target.value);
                  setValidationError('');
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(validationError && reasonCode === 'OTHER' && !reasonText.trim())}
                aria-describedby={validationError ? 'decision-validation-error' : undefined}
              />
            </>
          )}
          {validationError && <p id="decision-validation-error" className="field-error" role="alert">{validationError}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className={isReject ? 'danger-button' : 'approve-button'} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : isReject ? 'Reject request' : 'Approve request'}
            </button>
          </div>
        </form>
    </AdminModal>
  );
};

export default KycDecisionModal;
