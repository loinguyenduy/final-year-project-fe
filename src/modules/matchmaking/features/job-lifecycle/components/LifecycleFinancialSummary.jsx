import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { formatCurrency, formatDateTime } from '../utils/jobLifecycleUi';

const LifecycleFinancialSummary = ({
  deposit,
  jobStatus,
  selectedBid,
  warranty,
}) => {
  const completed = jobStatus === 'CLOSED' || warranty?.status === 'COMPLETED';
  const heading = completed
    ? 'Payment complete'
    : warranty
      ? 'Warranty protection active'
      : 'Payment protected';
  const copy = completed
    ? 'The payment lifecycle for this Job is complete.'
    : warranty
      ? 'Payment remains protected while the warranty lifecycle is active.'
      : 'Payment remains protected while the service is in progress.';

  return (
    <section className="lifecycle-financial" aria-labelledby="lifecycle-financial-title">
      <span className="lifecycle-context-label">Financial summary</span>
      <div className="lifecycle-financial__heading">
        <FaShieldAlt aria-hidden="true" />
        <div><h2 id="lifecycle-financial-title">{heading}</h2><p>{copy}</p></div>
      </div>
      <dl className="lifecycle-financial__details">
        <div><dt>Agreed service price</dt><dd>{formatCurrency(selectedBid?.proposed_price)}</dd></div>
        <div><dt>Payment status</dt><dd>{completed ? 'Completed' : 'Protected'}</dd></div>
        {deposit?.paid_at && <div><dt>Deposit paid</dt><dd>{formatDateTime(deposit.paid_at)}</dd></div>}
        {warranty?.released_at && <div><dt>Payment completed</dt><dd>{formatDateTime(warranty.released_at)}</dd></div>}
      </dl>
    </section>
  );
};

export default LifecycleFinancialSummary;
