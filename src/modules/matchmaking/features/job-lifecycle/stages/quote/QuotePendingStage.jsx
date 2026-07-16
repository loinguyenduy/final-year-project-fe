import React from 'react';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import BeforeEvidenceManager from '../../components/BeforeEvidenceManager';
import QuoteReadOnlyView from '../../components/QuoteReadOnlyView';

const QuotePendingStage = ({
  allowedActions,
  evidenceState,
  isCancelling,
  onCancel,
  onOpenImage,
  quoteState,
  role,
}) => (
  <section className="lifecycle-stage lifecycle-stage--inspection" aria-labelledby="quote-pending-stage-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon" aria-hidden="true">
        <FaFileInvoiceDollar />
      </span>
      <div>
        <span className="lifecycle-stage__eyebrow">Quote pending</span>
        <h2 id="quote-pending-stage-title">
          {role === 'CUSTOMER'
            ? 'Review the submitted inspection and Quote'
            : 'The final Quote is waiting for the Customer'}
        </h2>
        <p>
          {role === 'CUSTOMER'
            ? 'The inspection evidence and canonical saved Quote are now available for review.'
            : 'The Quote and evidence are locked while the Customer reviews the submitted result.'}
        </p>
      </div>
    </div>

    {quoteState.loading && <p className="inspection-section__status">Loading submitted Quote…</p>}
    {quoteState.loadError && (
      <div className="lifecycle-notice lifecycle-notice--danger">{quoteState.loadError}</div>
    )}
    <QuoteReadOnlyView quote={quoteState.quote} />

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

    {role === 'CUSTOMER' && allowedActions.includes('VIEW_QUOTE') && (
      <div className="lifecycle-notice lifecycle-notice--neutral">
        Review the submitted details and continue coordinating with the Handyman in Chat.
      </div>
    )}

    {role === 'HANDYMAN' && allowedActions.includes('WAIT_FOR_CUSTOMER_QUOTE_RESPONSE') && (
      <div className="lifecycle-notice lifecycle-notice--neutral">
        The Customer has not responded to the Quote yet. Chat remains available.
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

export default QuotePendingStage;
