import React from 'react';
import LifecycleModal from '../components/LifecycleModal';
import { formatCurrency } from '../utils/jobLifecycleUi';

const AcceptQuoteModal = ({
  amounts,
  onClose,
  onConfirm,
  open,
  submitting,
}) => (
  <LifecycleModal
    open={open}
    onClose={onClose}
    submitting={submitting}
    title="Accept final Quote?"
    titleId="accept-quote-title"
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
          className="lifecycle-btn lifecycle-btn--primary"
          onClick={onConfirm}
          disabled={submitting || !amounts}
        >
          {submitting ? 'Accepting Quote...' : 'Accept Quote'}
        </button>
      </>
    )}
  >
    <p>
      Accepting confirms the canonical inspection Quote. It does not debit the
      remaining amount yet.
    </p>
    {!amounts && (
      <div className="lifecycle-notice lifecycle-notice--danger" role="alert">
        This Quote is lower than the deposit already held or its payment data is invalid.
        It cannot be accepted. Ask the Handyman to correct the Quote.
      </div>
    )}
    <dl className="lifecycle-confirmation-summary">
      <div><dt>Final Quote</dt><dd>{formatCurrency(amounts?.quoteTotal)}</dd></div>
      <div><dt>Deposit already held</dt><dd>{formatCurrency(amounts?.deposit)}</dd></div>
      <div><dt>Remaining after acceptance</dt><dd>{formatCurrency(amounts?.remaining)}</dd></div>
    </dl>
    <div className="lifecycle-notice lifecycle-notice--neutral">
      After acceptance, the Job moves to Payment pending. You will review and
      confirm the remaining payment in a separate step.
    </div>
  </LifecycleModal>
);

export default AcceptQuoteModal;
