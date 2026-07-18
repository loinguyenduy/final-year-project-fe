import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { formatCurrency, formatDateTime } from '../utils/jobLifecycleUi';

const LifecycleFinancialSummary = ({ deposit, selectedBid }) => (
  <section className="lifecycle-financial" aria-labelledby="lifecycle-financial-title">
    <span className="lifecycle-context-label">Financial summary</span>
    <div className="lifecycle-financial__heading">
      <FaShieldAlt aria-hidden="true" />
      <div>
        <h2 id="lifecycle-financial-title">Deposit protected</h2>
        <p>The job deposit is being held securely.</p>
      </div>
    </div>

    <dl className="lifecycle-financial__details">
      <div>
        <dt>Selected bid</dt>
        <dd>{formatCurrency(selectedBid?.proposed_price)}</dd>
      </div>
      <div>
        <dt>Deposit</dt>
        <dd>{formatCurrency(deposit?.amount)}</dd>
      </div>
      <div>
        <dt>Deposit status</dt>
        <dd>{deposit?.status === 'HELD' ? 'Held securely' : 'Payment recorded'}</dd>
      </div>
      {deposit?.paid_at && (
        <div>
          <dt>Paid at</dt>
          <dd>{formatDateTime(deposit.paid_at)}</dd>
        </div>
      )}
    </dl>
  </section>
);

export default LifecycleFinancialSummary;
