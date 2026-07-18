import React from 'react';
import { FaFileContract } from 'react-icons/fa';
import { QUOTE_ITEM_TYPE_OPTIONS } from '../constants/inspectionQuote.constants';
import { formatCurrency, formatDateTime } from '../utils/jobLifecycleUi';

const formatDuration = (minutes) => {
  const value = Number(minutes);
  if (!Number.isInteger(value) || value < 1) return 'Not available';
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const ContractReadOnlyView = ({ contract }) => {
  if (!contract) return null;
  return (
    <section className="inspection-section contract-view" aria-labelledby="active-contract-title">
      <div className="inspection-section__header">
        <div>
          <span className="lifecycle-stage__eyebrow">Immutable service Contract</span>
          <h3 id="active-contract-title">
            <FaFileContract aria-hidden="true" /> {contract.contract_number}
          </h3>
          <p>Effective {formatDateTime(contract.effective_at)}</p>
        </div>
        <span className="inspection-section__count">{contract.status}</span>
      </div>

      <dl className="quote-report contract-view__parties">
        <div><dt>Customer</dt><dd>{contract.customer_name}</dd></div>
        <div><dt>Handyman</dt><dd>{contract.handyman_name}</dd></div>
        <div><dt>Service address</dt><dd>{contract.service_address}</dd></div>
        <div><dt>Acceptance cycle</dt><dd>{contract.acceptance_cycle}</dd></div>
      </dl>

      <dl className="quote-report">
        <div><dt>Problem summary</dt><dd>{contract.problem_summary}</dd></div>
        {contract.inspection_notes && (
          <div><dt>Inspection notes</dt><dd>{contract.inspection_notes}</dd></div>
        )}
        <div><dt>Recommended solution</dt><dd>{contract.recommended_solution}</dd></div>
        <div><dt>Estimated duration</dt><dd>{formatDuration(contract.estimated_duration_minutes)}</dd></div>
        <div>
          <dt>Warranty snapshot</dt>
          <dd>{Number(contract.warranty_days) === 0 ? 'No warranty' : `${contract.warranty_days} day(s)`}</dd>
        </div>
      </dl>

      <div className="quote-readonly-items">
        <div className="quote-readonly-items__head">
          <span>Item</span><span>Quantity</span><span>Unit price</span><span>Total</span>
        </div>
        {(contract.items || []).map((item, index) => (
          <div className="quote-readonly-items__row" key={`${item.sort_order}-${index}`}>
            <span>
              <strong>{item.name}</strong>
              <small>
                {QUOTE_ITEM_TYPE_OPTIONS.find((option) => option.value === item.item_type)?.label || 'Other'}
                {' · '}
                {item.unit}
              </small>
              {item.description && <small>{item.description}</small>}
            </span>
            <span>{item.quantity}</span>
            <span>{formatCurrency(item.unit_price)}</span>
            <span>{formatCurrency(item.line_total)}</span>
          </div>
        ))}
      </div>

      <dl className="quote-readonly-totals">
        <div><dt>Subtotal</dt><dd>{formatCurrency(contract.subtotal_amount)}</dd></div>
        <div><dt>Quote total</dt><dd>{formatCurrency(contract.quote_total_amount)}</dd></div>
        <div><dt>Deposit</dt><dd>{formatCurrency(contract.deposit_amount)}</dd></div>
        <div><dt>Remaining payment</dt><dd>{formatCurrency(contract.remaining_payment_amount)}</dd></div>
        <div><dt>Full escrow amount</dt><dd>{formatCurrency(contract.full_escrow_amount)}</dd></div>
      </dl>

      <dl className="lifecycle-request-facts">
        <div><dt>Quote accepted</dt><dd>{formatDateTime(contract.customer_accepted_at)}</dd></div>
        <div><dt>Payment completed</dt><dd>{formatDateTime(contract.payment_completed_at)}</dd></div>
      </dl>
    </section>
  );
};

export default ContractReadOnlyView;
