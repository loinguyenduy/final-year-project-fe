import React from 'react';
import { FaCheckCircle, FaFileInvoiceDollar } from 'react-icons/fa';
import BeforeEvidenceManager from '../../components/BeforeEvidenceManager';
import QuoteDraftEditor from '../../components/QuoteDraftEditor';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const HandymanArrivedStage = ({
  allowedActions,
  arrivedAt,
  evidenceState,
  isCancelling,
  onCancel,
  onOpenImage,
  onRequestSubmit,
  quoteState,
  quoteSummary,
}) => {
  const canCreateDraft = allowedActions.includes('CREATE_QUOTE_DRAFT');
  const canUpdateDraft = allowedActions.includes('UPDATE_QUOTE_DRAFT');
  const canSubmit = allowedActions.includes('SUBMIT_QUOTE');

  return (
    <section className="lifecycle-stage lifecycle-stage--inspection" aria-labelledby="handyman-arrived-stage-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true">
          <FaCheckCircle />
        </span>
        <div>
          <span className="lifecycle-stage__eyebrow">Arrived</span>
          <h2 id="handyman-arrived-stage-title">Inspect the Job and prepare the final Quote</h2>
          <p>
            Record Before evidence, save the inspection report, then submit only when
            the backend confirms the saved Draft is ready.
          </p>
        </div>
      </div>

      <dl className="lifecycle-request-facts lifecycle-request-facts--single">
        <div>
          <dt>Arrival confirmed</dt>
          <dd>{formatDateTime(arrivedAt)}</dd>
        </div>
      </dl>

      <BeforeEvidenceManager
        canDelete={allowedActions.includes('DELETE_BEFORE_EVIDENCE')}
        canUpload={allowedActions.includes('UPLOAD_BEFORE_EVIDENCE')}
        deletingId={evidenceState.deletingId}
        evidence={evidenceState.evidence}
        loadError={evidenceState.loadError}
        loading={evidenceState.loading}
        onDelete={evidenceState.deleteEvidence}
        onOpenImage={onOpenImage}
        onRemoveFailedUpload={evidenceState.removeFailedUpload}
        onRetryUpload={evidenceState.retryUpload}
        onUpload={evidenceState.uploadFiles}
        uploads={evidenceState.uploads}
      />

      {!quoteState.quote && (
        <section className="inspection-section" aria-labelledby="create-quote-title">
          <div className="inspection-section__header">
            <div>
              <span className="lifecycle-stage__eyebrow">Final quote</span>
              <h3 id="create-quote-title">Create an inspection Quote Draft</h3>
              <p>
                A Draft can be incomplete and saved repeatedly. The Customer cannot see it before submission.
              </p>
            </div>
          </div>
          {quoteState.loadError && (
            <div className="lifecycle-notice lifecycle-notice--danger">{quoteState.loadError}</div>
          )}
          {canCreateDraft && (
            <div className="lifecycle-stage__primary-bar">
              <button
                type="button"
                className="lifecycle-btn lifecycle-btn--primary"
                onClick={() => void quoteState.createDraft()}
                disabled={quoteState.creating}
              >
                <FaFileInvoiceDollar aria-hidden="true" />
                {quoteState.creating ? 'Creating Draft…' : 'Create Quote Draft'}
              </button>
            </div>
          )}
        </section>
      )}

      {quoteState.loading && <p className="inspection-section__status">Loading Quote Draft…</p>}
      {quoteState.quote?.status === 'DRAFT' && canUpdateDraft && (
        <QuoteDraftEditor
          canSubmit={canSubmit}
          quoteState={quoteState}
          readiness={quoteSummary?.readiness || quoteState.quote.readiness}
          onRequestSubmit={onRequestSubmit}
        />
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

export default HandymanArrivedStage;
