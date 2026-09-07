import React from 'react';
import LifecycleModal from '../components/LifecycleModal';
import { formatCurrency } from '../utils/jobLifecycleUi';

const RemainingPaymentModal = ({
  insufficientBalance,
  onClose,
  onConfirm,
  open,
  payment,
  submitting,
}) => {
  const remainingIsZero = String(payment?.remaining_amount || '') === '0';
  const missingAmount = insufficientBalance?.missingAmount;
  const openWallet = () => {
    const amount = /^\d+$/.test(String(missingAmount || '')) ? missingAmount : '';
    window.open(`/customer/wallet${amount ? `?amount=${amount}` : ''}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <LifecycleModal
      open={open}
      onClose={onClose}
      submitting={submitting}
      title={remainingIsZero ? 'Activate Contract?' : 'Pay remaining amount?'}
      titleId="remaining-payment-title"
      footer={(
        <>
          {missingAmount && (
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--secondary"
              onClick={openWallet}
              disabled={submitting}
            >
              Top up Wallet
            </button>
          )}
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Back
          </button>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            onClick={onConfirm}
            disabled={submitting || !payment}
          >
            {submitting
              ? 'Processing...'
              : remainingIsZero
                ? 'Activate Contract'
                : `Pay ${formatCurrency(payment?.remaining_amount)}`}
          </button>
        </>
      )}
    >
      <p>
        {remainingIsZero
          ? 'The held deposit already covers the full Quote. No zero-value transaction will be created.'
          : 'The remaining amount will move from your Customer wallet into system escrow. No funds are released to the Handyman yet.'}
      </p>
      <dl className="lifecycle-confirmation-summary">
        <div><dt>Accepted Quote</dt><dd>{formatCurrency(payment?.quote_total_amount)}</dd></div>
        <div><dt>Deposit held</dt><dd>{formatCurrency(payment?.deposit_amount)}</dd></div>
        <div><dt>Remaining payment</dt><dd>{formatCurrency(payment?.remaining_amount)}</dd></div>
      </dl>
      {missingAmount && (
        <div className="lifecycle-notice lifecycle-notice--danger" role="alert">
          The wallet is short by {formatCurrency(missingAmount)}. Open Wallet in
          a new tab, top up, then return here and retry.
        </div>
      )}
    </LifecycleModal>
  );
};

export default RemainingPaymentModal;
