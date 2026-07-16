import React from 'react';
import { QUOTE_VARIANCE_REASON_OPTIONS } from '../constants/inspectionQuote.constants';
import { formatCurrency, formatDateTime } from '../utils/jobLifecycleUi';

const formatDuration = (minutes) => {
  const value = Number(minutes);
  if (!Number.isInteger(value) || value < 1) return 'Not available';
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const QuoteReadOnlyView = ({ quote }) => {
  if (!quote) return null;
  const varianceReasonLabel = QUOTE_VARIANCE_REASON_OPTIONS.find(
    (option) => option.value === quote.variance_reason,
  )?.label;
  return (
    <section className="inspection-section" aria-labelledby="submitted-quote-title">
      <div className="inspection-section__header">
        <div>
          <span className="lifecycle-stage__eyebrow">Submitted Quote</span>
          <h3 id="submitted-quote-title">Inspection report and pricing</h3>
          <p>Version {quote.version} · Submitted {formatDateTime(quote.submitted_at)}</p>
        </div>
        <span className="inspection-section__count">Submitted</span>
      </div>

      <dl className="quote-report">
        <div>
          <dt>Problem summary</dt>
          <dd>{quote.problem_summary || 'Not provided'}</dd>
        </div>
        {quote.inspection_notes && (
          <div>
            <dt>Inspection notes</dt>
            <dd>{quote.inspection_notes}</dd>
          </div>
        )}
        <div>
          <dt>Recommended solution</dt>
          <dd>{quote.recommended_solution || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Estimated duration</dt>
          <dd>{formatDuration(quote.estimated_duration_minutes)}</dd>
        </div>
        <div>
          <dt>Warranty</dt>
          <dd>{Number(quote.warranty_days) === 0 ? 'No warranty' : `${quote.warranty_days} day(s)`}</dd>
        </div>
      </dl>

      <div className="quote-readonly-items">
        <div className="quote-readonly-items__head">
          <span>Item</span><span>Quantity</span><span>Unit price</span><span>Total</span>
        </div>
        {(quote.items || []).map((item) => (
          <div className="quote-readonly-items__row" key={item.id || item.sort_order}>
            <span>
              <strong>{item.description}</strong>
              <small>{item.item_type} · {item.unit}</small>
            </span>
            <span>{item.quantity}</span>
            <span>{formatCurrency(item.unit_price)}</span>
            <span>{formatCurrency(item.line_total)}</span>
          </div>
        ))}
      </div>

      <dl className="quote-readonly-totals">
        <div><dt>Subtotal</dt><dd>{formatCurrency(quote.subtotal_amount)}</dd></div>
        <div><dt>Discount</dt><dd>{formatCurrency(quote.discount_amount)}</dd></div>
        <div><dt>Selected Bid</dt><dd>{formatCurrency(quote.bid_reference_amount)}</dd></div>
        <div>
          <dt>Difference</dt>
          <dd>{formatCurrency(quote.variance_amount)} ({quote.variance_percent || '0'}%)</dd>
        </div>
        <div><dt>Total</dt><dd>{formatCurrency(quote.total_amount)}</dd></div>
      </dl>

      {quote.variance_reason && (
        <div className="lifecycle-notice lifecycle-notice--neutral">
          <strong>Variance reason</strong>
          <span>{varianceReasonLabel || 'Additional inspection context'}</span>
          {quote.variance_reason_text && <span>· {quote.variance_reason_text}</span>}
        </div>
      )}
    </section>
  );
};

export default QuoteReadOnlyView;
