import React from 'react';
import LifecycleModal from '../components/LifecycleModal';
import { formatCurrency } from '../utils/jobLifecycleUi';

const SubmitQuoteModal = ({
  onClose,
  onConfirm,
  open,
  quote,
  submitting,
}) => (
  <LifecycleModal
    open={open}
    onClose={onClose}
    submitting={submitting}
    title="Submit final Quote?"
    titleId="submit-quote-title"
    footer={(
      <>
        <button
          type="button"
          className="lifecycle-btn lifecycle-btn--secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Keep editing
        </button>
        <button
          type="button"
          className="lifecycle-btn lifecycle-btn--primary"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Quote'}
        </button>
      </>
    )}
  >
    <p>
      The saved Quote total is <strong>{formatCurrency(quote?.total_amount)}</strong>.
      Submission locks the Draft and inspection photos, then moves the Job to Quote pending.
    </p>
    <div className="lifecycle-notice lifecycle-notice--warning">
      Submit uses only the latest saved Draft. Unsaved changes are never saved automatically.
    </div>
  </LifecycleModal>
);

export default SubmitQuoteModal;
