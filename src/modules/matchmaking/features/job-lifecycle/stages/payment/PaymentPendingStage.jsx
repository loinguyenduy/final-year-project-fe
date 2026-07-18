import React from 'react';
import { FaCreditCard } from 'react-icons/fa';
import BeforeEvidenceManager from '../../components/BeforeEvidenceManager';
import QuoteReadOnlyView from '../../components/QuoteReadOnlyView';
import { formatCurrency, formatDateTime } from '../../utils/jobLifecycleUi';

const PaymentPendingStage = ({
  allowedActions,
  evidenceState,
  isCancelling,
  onCancel,
  onOpenImage,
  onPay,
  paymentState,
  quoteState,
  role,
}) => {
  const payment = paymentState.payment;
  const remainingIsZero = String(payment?.remaining_amount || '') === '0';
  return (
    <section className="lifecycle-stage lifecycle-stage--inspection" aria-labelledby="payment-pending-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon" aria-hidden="true"><FaCreditCard /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">Payment pending</span>
          <h2 id="payment-pending-title">
            {role === 'CUSTOMER'
              ? 'Complete payment to activate the Contract'
              : 'Waiting for the Customer to activate the Contract'}
          </h2>
          <p>
            The final Quote is accepted. The deposit remains held and Chat stays active.
          </p>
        </div>
      </div>

      {paymentState.paymentLoading && <p>Loading payment summary...</p>}
      {paymentState.paymentError && (
        <div className="lifecycle-notice lifecycle-notice--danger">{paymentState.paymentError}</div>
      )}
      {payment && (
        <dl className="lifecycle-payment-summary">
          <div><dt>Accepted Quote</dt><dd>{formatCurrency(payment.quote_total_amount)}</dd></div>
          <div><dt>Deposit held</dt><dd>{formatCurrency(payment.deposit_amount)}</dd></div>
          <div><dt>Remaining</dt><dd>{formatCurrency(payment.remaining_amount)}</dd></div>
          <div><dt>Payment status</dt><dd>{payment.status}</dd></div>
          {payment.payment_completed_at && (
            <div><dt>Completed</dt><dd>{formatDateTime(payment.payment_completed_at)}</dd></div>
          )}
        </dl>
      )}

      <QuoteReadOnlyView quote={quoteState.quote} showVariance={role === 'HANDYMAN'} />
      <BeforeEvidenceManager
        canDelete={false}
        canUpload={false}
        deletingId={null}
        evidence={evidenceState.evidence}
        loadError={evidenceState.loadError}
        loading={evidenceState.loading}
        onDelete={() => {}}
        onOpenImage={onOpenImage}
        onRemoveFailedUpload={() => {}}
        onRetryUpload={() => {}}
        onUpload={() => {}}
        uploads={[]}
      />

      {role === 'CUSTOMER' && allowedActions.includes('PAY_REMAINING_AMOUNT') && (
        <div className="lifecycle-stage__primary-bar">
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            onClick={onPay}
            disabled={paymentState.paying || !payment}
          >
            <FaCreditCard aria-hidden="true" />
            {remainingIsZero ? 'Activate Contract' : 'Pay remaining amount'}
          </button>
        </div>
      )}
      {role === 'HANDYMAN' && allowedActions.includes('WAIT_FOR_CUSTOMER_PAYMENT') && (
        <div className="lifecycle-notice lifecycle-notice--neutral">
          No payment is released to you at this stage. The full Quote is being secured in escrow.
        </div>
      )}

      {allowedActions.includes('REQUEST_CANCELLATION') && (
        <div className="lifecycle-stage__exception">
          <span>Can’t continue with this Job?</span>
          <button type="button" onClick={onCancel} disabled={isCancelling}>
            View cancellation options
          </button>
        </div>
      )}
    </section>
  );
};

export default PaymentPendingStage;
