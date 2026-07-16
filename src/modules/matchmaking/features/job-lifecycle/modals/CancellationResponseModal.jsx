import React, { useEffect, useState } from 'react';
import LifecycleModal from '../components/LifecycleModal';
import { formatCurrency } from '../utils/jobLifecycleUi';

const CancellationResponseModal = ({ cancellation, mode, onClose, onSubmit, open, submitting }) => {
  const [responseNote, setResponseNote] = useState('');
  useEffect(() => {
    if (open) setResponseNote('');
  }, [open]);
  const isConfirm = mode === 'CONFIRM';
  const submit = async () => {
    const response = await onSubmit(isConfirm ? {} : { response_note: responseNote.trim() || null });
    if (response) onClose();
  };
  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title={isConfirm ? 'Confirm cancellation?' : 'Decline cancellation?'}
      titleId="cancellation-response-title"
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onClose} disabled={submitting}>Back</button>
          <button type="button" className={`lifecycle-btn ${isConfirm ? 'lifecycle-btn--danger' : 'lifecycle-btn--primary'}`} onClick={submit} disabled={submitting}>
            {submitting && <span className="spinner-border spinner-border-sm" />}
            {isConfirm ? 'Confirm cancellation' : 'Send response'}
          </button>
        </>
      )}
    >
      {isConfirm ? (
        <>
          <p>The job will be cancelled, chat will close, and the deposit will follow the neutral policy for the original stage.</p>
          <div className="lifecycle-cancellation-preview">
            <strong>Estimated distribution</strong>
            <dl>
              <div>
                <dt>Deposit</dt>
                <dd>{formatCurrency(cancellation?.financial_preview?.deposit_amount)}</dd>
              </div>
              {cancellation?.financial_preview?.customer_refund_amount != null && (
                <div>
                  <dt>Customer receives</dt>
                  <dd>{formatCurrency(cancellation.financial_preview.customer_refund_amount)}</dd>
                </div>
              )}
              {cancellation?.financial_preview?.handyman_compensation_amount != null && (
                <div>
                  <dt>Handyman receives</dt>
                  <dd>{formatCurrency(cancellation.financial_preview.handyman_compensation_amount)}</dd>
                </div>
              )}
            </dl>
          </div>
        </>
      ) : (
        <>
          <p>The request will move to review. The job is not cancelled, the deposit remains held, and chat stays active.</p>
          <label className="lifecycle-field">
            <span>Response note (optional)</span>
            <textarea rows="4" maxLength="500" value={responseNote} onChange={(event) => setResponseNote(event.target.value)} />
            <small>{responseNote.length}/500</small>
          </label>
        </>
      )}
    </LifecycleModal>
  );
};

export default CancellationResponseModal;
