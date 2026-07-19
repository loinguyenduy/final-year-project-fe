import React, { useEffect, useState } from 'react';
import LifecycleModal from './LifecycleModal';

const COMPLETION_REASONS = Object.freeze([
  ['WORK_NOT_COMPLETED', 'Work is not completed'],
  ['RESULT_NOT_AS_AGREED', 'Result is not as agreed'],
  ['FUNCTION_NOT_WORKING', 'The repaired function is not working'],
  ['ADDITIONAL_DAMAGE_FOUND', 'Additional damage was found'],
  ['CLEANUP_NOT_COMPLETED', 'Cleanup is not completed'],
  ['OTHER', 'Another reason'],
]);

const CLAIM_REASONS = Object.freeze([
  ['ISSUE_RETURNED', 'The issue returned'],
  ['REPAIR_NOT_EFFECTIVE', 'The repair was not effective'],
  ['REPLACED_PART_FAILED', 'A replaced part failed'],
  ['RELATED_DAMAGE_FOUND', 'Related damage was found'],
  ['WORK_NOT_AS_AGREED', 'Work was not as agreed'],
  ['OTHER', 'Another reason'],
]);

const RequestNoteModal = ({ onClose, onSubmit, open, submitting, title, warning }) => {
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) setNote('');
  }, [open]);
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title={title}
      titleId="work-request-modal-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            disabled={submitting}
            onClick={() => void onSubmit({ completion_note: note.trim() || null })}
          >
            {submitting ? 'Sending…' : 'Send request'}
          </button>
        </>
      )}
    >
      <p>{warning}</p>
      <label className="lifecycle-field">
        <span>Completion note <small>(optional)</small></span>
        <textarea
          rows="5"
          maxLength="2000"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Summarize the work completed for the other participant."
        />
        <small>{note.length}/2000</small>
      </label>
    </LifecycleModal>
  );
};

const RejectWorkModal = ({ onClose, onSubmit, open, submitting, title }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) {
      setReason('');
      setNote('');
    }
  }, [open]);
  const valid = Boolean(reason) && (reason !== 'OTHER' || Boolean(note.trim()));
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title={title}
      titleId="reject-work-modal-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--danger"
            disabled={!valid || submitting}
            onClick={() => void onSubmit({ reason, note: note.trim() || null })}
          >
            {submitting ? 'Submitting…' : 'Reject work'}
          </button>
        </>
      )}
    >
      <label className="lifecycle-field">
        <span>Reason</span>
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="">Select a reason</option>
          {COMPLETION_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="lifecycle-field">
        <span>Note {reason === 'OTHER' ? '(required)' : '(optional)'}</span>
        <textarea rows="4" maxLength="500" value={note} onChange={(event) => setNote(event.target.value)} />
        <small>{note.length}/500</small>
      </label>
    </LifecycleModal>
  );
};

const ConfirmCompletionModal = ({ onClose, onConfirm, open, submitting, warranty = false }) => (
  <LifecycleModal
    open={open}
    onClose={onClose}
    submitting={submitting}
    title={warranty ? 'Confirm warranty work' : 'Confirm completed work'}
    titleId="confirm-work-modal-title"
    footer={(
      <>
        <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onClose} disabled={submitting}>Go back</button>
        <button type="button" className="lifecycle-btn lifecycle-btn--primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Confirming…' : 'Confirm completion'}
        </button>
      </>
    )}
  >
    <p>
      {warranty
        ? 'Confirm that the requested warranty rework has been completed.'
        : 'Confirm that the agreed service has been completed. This will start the warranty period.'}
    </p>
  </LifecycleModal>
);

const ClaimSubmitModal = ({ onClose, onSubmit, open, submitting }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    if (!open) {
      setReason('');
      setDescription('');
    }
  }, [open]);
  const valid = Boolean(reason) && (reason !== 'OTHER' || Boolean(description.trim()));
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title="Submit warranty claim"
      titleId="claim-submit-modal-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            disabled={!valid || submitting}
            onClick={() => void onSubmit({ reason, description: description.trim() || null })}
          >
            {submitting ? 'Submitting…' : 'Submit claim'}
          </button>
        </>
      )}
    >
      <p>Your uploaded Claim Evidence will be locked and submitted for review.</p>
      <label className="lifecycle-field">
        <span>Claim reason</span>
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="">Select a reason</option>
          {CLAIM_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="lifecycle-field">
        <span>Description {reason === 'OTHER' ? '(required)' : '(optional)'}</span>
        <textarea rows="5" maxLength="2000" value={description} onChange={(event) => setDescription(event.target.value)} />
        <small>{description.length}/2000</small>
      </label>
    </LifecycleModal>
  );
};

export {
  ClaimSubmitModal,
  ConfirmCompletionModal,
  RejectWorkModal,
  RequestNoteModal,
};
