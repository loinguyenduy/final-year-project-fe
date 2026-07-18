import React from 'react';
import LifecycleModal from '../components/LifecycleModal';

const ConfirmArrivalModal = ({ onClose, onConfirm, open, submitting }) => (
  <LifecycleModal
    open={open}
    onClose={onClose}
    submitting={submitting}
    title="Confirm the handyman has arrived?"
    titleId="confirm-arrival-title"
    footer={(
      <>
        <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onClose} disabled={submitting}>Back</button>
        <button type="button" className="lifecycle-btn lifecycle-btn--primary" onClick={onConfirm} disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
          Confirm arrival
        </button>
      </>
    )}
  >
    <p>The job will move to Arrived. The deposit and chat remain unchanged.</p>
  </LifecycleModal>
);

export default ConfirmArrivalModal;
