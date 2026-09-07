import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaClipboardCheck, FaHourglassHalf, FaTools } from 'react-icons/fa';
import ContractReadOnlyView from '../../components/ContractReadOnlyView';
import EvidenceManager from '../../components/EvidenceManager';
import LifecycleHistoryAccordion from '../../components/LifecycleHistoryAccordion';
import {
  ConfirmCompletionModal,
  RejectWorkModal,
  RequestNoteModal,
} from '../../components/LifecycleWorkDialogs';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const BLOCKING_COPY = Object.freeze({
  DURING_EVIDENCE_REQUIRED: 'Add at least one During photo.',
  AFTER_EVIDENCE_REQUIRED: 'Add at least one After photo.',
  COMPLETION_REQUEST_ALREADY_PENDING: 'The customer is reviewing the current request.',
  NEW_COMPLETION_EVIDENCE_REQUIRED: 'Add at least one new photo before retrying.',
});

const RequestSummary = ({ request }) => {
  if (!request) return null;
  return (
    <section className="lifecycle-request-card">
      <div>
        <span className="lifecycle-stage__eyebrow">Completion request #{request.request_sequence}</span>
        <h3>{String(request.status).replaceAll('_', ' ')}</h3>
      </div>
      <dl className="lifecycle-request-facts">
        <div><dt>Requested</dt><dd>{formatDateTime(request.requested_at)}</dd></div>
        <div><dt>Note</dt><dd>{request.completion_note || 'No note provided'}</dd></div>
        {request.rejection_reason && (
          <div><dt>Previous rejection</dt><dd>{String(request.rejection_reason).replaceAll('_', ' ')}</dd></div>
        )}
        {request.rejection_note && <div><dt>Customer note</dt><dd>{request.rejection_note}</dd></div>}
      </dl>
    </section>
  );
};

const InProgressStage = ({
  afterEvidence,
  allowedActions,
  completionState,
  contractState,
  details,
  duringEvidence,
  onOpenImage,
  role,
}) => {
  const latest = details.completion?.latest_request;
  const readiness = details.completion?.readiness;
  const pending = latest?.status === 'PENDING';
  const inferredAfterOpen = Boolean(
    readiness?.after_evidence_count
    || readiness?.unlocked_after_evidence_count
    || latest,
  );
  const [afterOpen, setAfterOpen] = useState(inferredAfterOpen);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    if (inferredAfterOpen) setAfterOpen(true);
  }, [inferredAfterOpen]);

  const blockingReasons = useMemo(
    () => (readiness?.blocking_reasons || []).map((reason) => BLOCKING_COPY[reason] || reason),
    [readiness?.blocking_reasons],
  );
  const isHandyman = role === 'HANDYMAN';

  return (
    <section className="lifecycle-stage lifecycle-stage--inspection" aria-labelledby="in-progress-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true"><FaTools /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">In progress</span>
          <h2 id="in-progress-title">
            {isHandyman ? 'Document and complete the work' : 'The service Contract is active'}
          </h2>
          <p>
            {isHandyman
              ? 'Keep clear work records, then ask the customer to confirm when the service is complete.'
              : 'The agreed payment remains protected while the Handyman completes the service.'}
          </p>
        </div>
      </div>

      <dl className="lifecycle-request-facts lifecycle-request-facts--single">
        <div><dt>In progress since</dt><dd>{formatDateTime(details.job.in_progress_at)}</dd></div>
      </dl>

      {contractState.contractLoading && <p>Loading active Contract…</p>}
      {contractState.contractError && <div className="lifecycle-notice lifecycle-notice--danger">{contractState.contractError}</div>}
      <ContractReadOnlyView contract={contractState.contract} />

      {isHandyman ? (
        <>
          <EvidenceManager
            {...duringEvidence}
            canDelete={allowedActions.includes('DELETE_DURING_EVIDENCE') && !pending}
            canUpload={allowedActions.includes('UPLOAD_DURING_EVIDENCE') && !pending}
            countMode="unlocked"
            description="Capture important progress, parts and work conditions before finishing."
            emptyCopy="No During Evidence has been added yet."
            eyebrow="During evidence"
            maxFiles={5}
            onDelete={duringEvidence.deleteEvidence}
            onOpenImage={onOpenImage}
            onRemoveFailedUpload={duringEvidence.removeFailedUpload}
            onRetryUpload={duringEvidence.retryUpload}
            onUpload={duringEvidence.uploadFiles}
            title="Work in progress photos"
          />

          {!afterOpen && !pending && (
            <div className="lifecycle-stage__actions lifecycle-progressive-action">
              <button type="button" className="lifecycle-btn lifecycle-btn--primary" onClick={() => setAfterOpen(true)}>
                <FaCheckCircle aria-hidden="true" /> Finish work
              </button>
              <small>This only opens the final evidence step; it does not change the Job status.</small>
            </div>
          )}

          {afterOpen && (
            <EvidenceManager
              {...afterEvidence}
              canDelete={allowedActions.includes('DELETE_AFTER_EVIDENCE') && !pending}
              canUpload={allowedActions.includes('UPLOAD_AFTER_EVIDENCE') && !pending}
              countMode="unlocked"
              description="Show the final result clearly from useful angles."
              emptyCopy="No After Evidence has been added yet."
              eyebrow="After evidence"
              maxFiles={5}
              onDelete={afterEvidence.deleteEvidence}
              onOpenImage={onOpenImage}
              onRemoveFailedUpload={afterEvidence.removeFailedUpload}
              onRetryUpload={afterEvidence.retryUpload}
              onUpload={afterEvidence.uploadFiles}
              title="Completed work photos"
            />
          )}

          {pending ? (
            <div className="lifecycle-notice lifecycle-notice--warning">
              <FaHourglassHalf aria-hidden="true" />
              <div><strong>Waiting for customer confirmation</strong><p>The submitted evidence is locked.</p></div>
            </div>
          ) : (
            <div className="lifecycle-readiness">
              <div>
                <strong>{readiness?.ready_to_request_completion ? 'Ready to request completion' : 'Completion checklist'}</strong>
                {blockingReasons.length > 0 && <ul>{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
              </div>
              <button
                type="button"
                className="lifecycle-btn lifecycle-btn--primary"
                disabled={!allowedActions.includes('REQUEST_COMPLETION') || Boolean(completionState.mutation)}
                onClick={() => setDialog('request')}
              >
                <FaClipboardCheck aria-hidden="true" /> Request completion
              </button>
            </div>
          )}
        </>
      ) : pending ? (
        <>
          <RequestSummary request={latest} />
          <div className="lifecycle-notice lifecycle-notice--neutral">
            Completion photos are private work records. Review the Contract, request note and your communication before responding.
          </div>
          <div className="lifecycle-stage__actions lifecycle-stage__actions--split">
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--danger"
              disabled={!allowedActions.includes('REJECT_COMPLETION') || Boolean(completionState.mutation)}
              onClick={() => setDialog('reject')}
            >
              Reject completion
            </button>
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--primary"
              disabled={!allowedActions.includes('CONFIRM_COMPLETION') || Boolean(completionState.mutation)}
              onClick={() => setDialog('confirm')}
            >
              Confirm completion
            </button>
          </div>
        </>
      ) : (
        <div className="lifecycle-notice lifecycle-notice--neutral">
          <FaHourglassHalf aria-hidden="true" />
          <div><strong>Waiting for a completion request</strong><p>The Handyman will notify you when the work is ready for review.</p></div>
        </div>
      )}

      {completionState.loadError && <div className="lifecycle-notice lifecycle-notice--danger">{completionState.loadError}</div>}
      {completionState.loading && <p className="inspection-section__status">Loading completion history…</p>}
      <LifecycleHistoryAccordion
        allowEvidence={isHandyman}
        emptyCopy="No completion requests yet."
        evidenceByItem={completionState.evidenceByRequest}
        evidenceLoadingKey={completionState.evidenceLoadingId}
        items={completionState.requests}
        onLoadEvidence={completionState.loadRequestEvidence}
        onOpenImage={onOpenImage}
        title="Completion request history"
      />

      <RequestNoteModal
        open={dialog === 'request'}
        title="Request work completion"
        warning="The current evidence snapshot will be locked and the customer will be asked to confirm the work."
        submitting={completionState.mutation === 'create'}
        onClose={() => setDialog(null)}
        onSubmit={async (payload) => {
          const response = await completionState.create(payload);
          if (response) setDialog(null);
        }}
      />
      <ConfirmCompletionModal
        open={dialog === 'confirm'}
        submitting={completionState.mutation === 'confirm'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          const response = await completionState.confirm(latest?.id);
          if (response) setDialog(null);
        }}
      />
      <RejectWorkModal
        open={dialog === 'reject'}
        title="Reject completed work"
        submitting={completionState.mutation === 'reject'}
        onClose={() => setDialog(null)}
        onSubmit={async (payload) => {
          const response = await completionState.reject(latest?.id, payload);
          if (response) setDialog(null);
        }}
      />
    </section>
  );
};

export default InProgressStage;
