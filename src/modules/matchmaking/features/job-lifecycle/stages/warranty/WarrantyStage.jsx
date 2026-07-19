import React, { useEffect, useState } from 'react';
import {
  FaClipboardList,
  FaHourglassHalf,
  FaPlay,
  FaRedo,
  FaShieldAlt,
} from 'react-icons/fa';
import EvidenceManager from '../../components/EvidenceManager';
import LifecycleHistoryAccordion from '../../components/LifecycleHistoryAccordion';
import {
  ClaimSubmitModal,
  ConfirmCompletionModal,
  RejectWorkModal,
  RequestNoteModal,
} from '../../components/LifecycleWorkDialogs';
import WarrantyCountdown from '../../components/WarrantyCountdown';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const STATUS_COPY = Object.freeze({
  ACTIVE: ['Warranty active', 'The service is protected during the warranty window.'],
  CLAIM_PENDING: ['Claim under review', 'Payment remains protected while the claim is reviewed.'],
  REWORK_REQUIRED: ['Warranty rework required', 'The approved claim requires corrective work.'],
  REWORK_CONFIRMATION_PENDING: ['Rework confirmation pending', 'The customer must confirm or reject the warranty work.'],
  REVIEW_REQUIRED: ['Further review required', 'Payment remains protected while the case is reviewed.'],
});

const RefreshNotice = ({ children, onRefresh }) => (
  <div className="lifecycle-notice lifecycle-notice--warning warranty-waiting">
    <FaHourglassHalf aria-hidden="true" />
    <div><strong>{children}</strong><p>Raw Admin decisions do not emit realtime events. Refresh to load the canonical status.</p></div>
    <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onRefresh}>
      <FaRedo aria-hidden="true" /> Refresh
    </button>
  </div>
);

const WarrantyStage = ({
  allowedActions,
  claimEvidenceState,
  completionState,
  details,
  onOpenImage,
  onRefresh,
  role,
  warrantyEvidenceState,
  warrantyState,
}) => {
  const warranty = details.warranty;
  const status = warranty?.status;
  const [dialog, setDialog] = useState(null);
  const isCustomer = role === 'CUSTOMER';
  const latestRework = warranty?.latest_rework_request;
  const approvedClaimAwaitingWarrantyTransition = status === 'CLAIM_PENDING'
    && warranty?.latest_claim?.status === 'APPROVED_REWORK_REQUIRED';
  const warrantyAwaitingClaimTransition = status === 'REWORK_REQUIRED'
    && warranty?.latest_claim?.status !== 'APPROVED_REWORK_REQUIRED';
  const inferredReworkOpen = Boolean(
    warranty?.readiness?.warranty_evidence_count
    || latestRework,
  );
  const [reworkOpen, setReworkOpen] = useState(inferredReworkOpen);
  const [heading, description] = STATUS_COPY[status] || ['Warranty', 'Warranty details are being synchronized.'];

  useEffect(() => {
    if (status !== 'REWORK_REQUIRED') setReworkOpen(false);
    else if (inferredReworkOpen) setReworkOpen(true);
  }, [inferredReworkOpen, status]);

  return (
    <section className="lifecycle-stage lifecycle-stage--warranty" aria-labelledby="warranty-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true"><FaShieldAlt /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">Warranty</span>
          <h2 id="warranty-title">{heading}</h2>
          <p>{description}</p>
        </div>
      </div>

      <dl className="lifecycle-request-facts">
        <div><dt>Started</dt><dd>{formatDateTime(warranty?.started_at)}</dd></div>
        <div><dt>Ends</dt><dd>{formatDateTime(warranty?.ends_at)}</dd></div>
        <div><dt>Warranty period</dt><dd>{warranty?.warranty_days} day(s)</dd></div>
        <div><dt>Status</dt><dd>{String(status || '').replaceAll('_', ' ')}</dd></div>
      </dl>
      {warranty?.ends_at && status === 'ACTIVE' && <WarrantyCountdown endsAt={warranty.ends_at} />}

      {status === 'ACTIVE' && isCustomer && (
        <>
          <EvidenceManager
            {...claimEvidenceState}
            canDelete={allowedActions.includes('DELETE_WARRANTY_CLAIM_EVIDENCE')}
            canUpload={allowedActions.includes('UPLOAD_WARRANTY_CLAIM_EVIDENCE')}
            countMode="unlocked"
            description="Add photos that clearly show the issue covered by the warranty."
            emptyCopy="No Claim Evidence has been added yet."
            eyebrow="Claim evidence"
            maxFiles={5}
            onDelete={claimEvidenceState.deleteEvidence}
            onOpenImage={onOpenImage}
            onRemoveFailedUpload={claimEvidenceState.removeFailedUpload}
            onRetryUpload={claimEvidenceState.retryUpload}
            onUpload={claimEvidenceState.uploadFiles}
            title="Document a warranty issue"
          />
          <div className="lifecycle-stage__actions">
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--primary"
              disabled={!allowedActions.includes('CREATE_WARRANTY_CLAIM') || Boolean(warrantyState.mutation)}
              onClick={() => setDialog('claim')}
            >
              <FaClipboardList aria-hidden="true" /> Submit warranty claim
            </button>
          </div>
        </>
      )}

      {status === 'ACTIVE' && !isCustomer && (
        <div className="lifecycle-notice lifecycle-notice--neutral">
          <FaHourglassHalf aria-hidden="true" />
          <div><strong>Warranty period in progress</strong><p>No action is required unless a claim is approved for rework.</p></div>
        </div>
      )}

      {approvedClaimAwaitingWarrantyTransition && (
        <div className="lifecycle-notice lifecycle-notice--danger">
          <div>
            <strong>The warranty transition is incomplete</strong>
            <p>
              The Claim is approved, but the Warranty is still marked as pending review.
              The Admin transition must also set the Warranty status to REWORK_REQUIRED before the Handyman can begin.
            </p>
          </div>
          <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onRefresh}>
            <FaRedo aria-hidden="true" /> Refresh
          </button>
        </div>
      )}

      {warrantyAwaitingClaimTransition && (
        <div className="lifecycle-notice lifecycle-notice--danger">
          <div>
            <strong>The warranty transition is incomplete</strong>
            <p>
              The Warranty is ready for rework, but the Claim has not been marked as approved.
              The Admin transition must set the Claim to APPROVED_REWORK_REQUIRED before work can begin.
            </p>
          </div>
          <button type="button" className="lifecycle-btn lifecycle-btn--ghost" onClick={onRefresh}>
            <FaRedo aria-hidden="true" /> Refresh
          </button>
        </div>
      )}

      {status === 'CLAIM_PENDING' && !approvedClaimAwaitingWarrantyTransition && (
        <RefreshNotice onRefresh={onRefresh}>Waiting for the claim review</RefreshNotice>
      )}

      {status === 'REWORK_REQUIRED' && !warrantyAwaitingClaimTransition && (isCustomer ? (
        <div className="lifecycle-notice lifecycle-notice--warning">
          <FaHourglassHalf aria-hidden="true" />
          <div><strong>Waiting for warranty rework</strong><p>The Handyman will send a completion request when the corrective work is finished.</p></div>
        </div>
      ) : (
        <>
          {!reworkOpen && (
            <div className="lifecycle-stage__actions lifecycle-progressive-action">
              <button
                type="button"
                className="lifecycle-btn lifecycle-btn--primary"
                disabled={!allowedActions.includes('UPLOAD_WARRANTY_EVIDENCE')}
                onClick={async () => {
                  await onRefresh();
                  setReworkOpen(true);
                }}
              >
                <FaPlay aria-hidden="true" /> Start warranty rework
              </button>
              <small>This opens the rework workspace; the canonical Warranty status remains REWORK_REQUIRED.</small>
            </div>
          )}
          {reworkOpen && (
            <>
              <div className="lifecycle-notice lifecycle-notice--neutral">
                <div>
                  <strong>Warranty rework in progress</strong>
                  <p>Upload photos of the corrective work, then request customer confirmation when finished.</p>
                </div>
              </div>
              <EvidenceManager
                {...warrantyEvidenceState}
                canDelete={allowedActions.includes('DELETE_WARRANTY_EVIDENCE')}
                canUpload={allowedActions.includes('UPLOAD_WARRANTY_EVIDENCE')}
                countMode="unlocked"
                description="Show the corrective work and the final warranty result."
                emptyCopy="No Warranty Rework Evidence has been added yet."
                eyebrow="Warranty evidence"
                maxFiles={5}
                onDelete={warrantyEvidenceState.deleteEvidence}
                onOpenImage={onOpenImage}
                onRemoveFailedUpload={warrantyEvidenceState.removeFailedUpload}
                onRetryUpload={warrantyEvidenceState.retryUpload}
                onUpload={warrantyEvidenceState.uploadFiles}
                title="Warranty rework photos"
              />
            </>
          )}
          {reworkOpen && <div className="lifecycle-stage__actions">
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--primary"
              disabled={!allowedActions.includes('REQUEST_WARRANTY_COMPLETION') || Boolean(warrantyState.mutation)}
              onClick={() => setDialog('request-rework')}
            >
              Request warranty completion
            </button>
          </div>}
        </>
      ))}

      {status === 'REWORK_CONFIRMATION_PENDING' && (isCustomer ? (
        <>
          <section className="lifecycle-request-card">
            <span className="lifecycle-stage__eyebrow">Warranty completion request</span>
            <h3>Review the rework request</h3>
            <dl className="lifecycle-request-facts">
              <div><dt>Requested</dt><dd>{formatDateTime(latestRework?.requested_at)}</dd></div>
              <div><dt>Note</dt><dd>{latestRework?.completion_note || 'No note provided'}</dd></div>
            </dl>
            <p className="lifecycle-privacy-copy">Warranty Rework Evidence is private. Use the request details and participant communication when responding.</p>
          </section>
          <div className="lifecycle-stage__actions lifecycle-stage__actions--split">
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--danger"
              disabled={!allowedActions.includes('REJECT_WARRANTY_COMPLETION') || Boolean(warrantyState.mutation)}
              onClick={() => setDialog('reject-rework')}
            >
              Reject rework
            </button>
            <button
              type="button"
              className="lifecycle-btn lifecycle-btn--primary"
              disabled={!allowedActions.includes('CONFIRM_WARRANTY_COMPLETION') || Boolean(warrantyState.mutation)}
              onClick={() => setDialog('confirm-rework')}
            >
              Confirm rework
            </button>
          </div>
        </>
      ) : (
        <div className="lifecycle-notice lifecycle-notice--warning">
          <FaHourglassHalf aria-hidden="true" />
          <div><strong>Waiting for customer confirmation</strong><p>The submitted Warranty Evidence is locked.</p></div>
        </div>
      ))}

      {status === 'REVIEW_REQUIRED' && (
        <RefreshNotice onRefresh={onRefresh}>Waiting for further review</RefreshNotice>
      )}

      {(warrantyState.loadError || completionState.loadError) && (
        <div className="lifecycle-notice lifecycle-notice--danger">
          {warrantyState.loadError || completionState.loadError}
        </div>
      )}
      {(warrantyState.loading || completionState.loading) && (
        <p className="inspection-section__status">Loading lifecycle history…</p>
      )}
      <LifecycleHistoryAccordion
        allowEvidence={!isCustomer}
        evidenceByItem={completionState.evidenceByRequest}
        evidenceLoadingKey={completionState.evidenceLoadingId}
        items={completionState.requests}
        onLoadEvidence={completionState.loadRequestEvidence}
        onOpenImage={onOpenImage}
        title="Completion request history"
      />
      <LifecycleHistoryAccordion
        allowEvidence
        emptyCopy="No warranty claims have been submitted."
        evidenceByItem={warrantyState.claimEvidence}
        evidenceLoadingKey={warrantyState.evidenceLoadingKey}
        evidenceLoadingPrefix="claim:"
        items={warrantyState.claims}
        kind="claim"
        onLoadEvidence={warrantyState.loadClaimEvidence}
        onOpenImage={onOpenImage}
        title="Warranty claim history"
      />
      <LifecycleHistoryAccordion
        allowEvidence={!isCustomer}
        evidenceByItem={warrantyState.requestEvidence}
        evidenceLoadingKey={warrantyState.evidenceLoadingKey}
        evidenceLoadingPrefix="request:"
        items={warrantyState.requests}
        onLoadEvidence={warrantyState.loadRequestEvidence}
        onOpenImage={onOpenImage}
        title="Warranty completion history"
      />

      <ClaimSubmitModal
        open={dialog === 'claim'}
        submitting={warrantyState.mutation === 'create-claim'}
        onClose={() => setDialog(null)}
        onSubmit={async (payload) => {
          const response = await warrantyState.createClaim(payload);
          if (response) setDialog(null);
        }}
      />
      <RequestNoteModal
        open={dialog === 'request-rework'}
        title="Request warranty completion"
        warning="The current Warranty Evidence will be locked and the customer will be asked to confirm the rework."
        submitting={warrantyState.mutation === 'create-rework-request'}
        onClose={() => setDialog(null)}
        onSubmit={async (payload) => {
          const response = await warrantyState.createReworkRequest(payload);
          if (response) setDialog(null);
        }}
      />
      <ConfirmCompletionModal
        warranty
        open={dialog === 'confirm-rework'}
        submitting={warrantyState.mutation === 'confirm-rework'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          const response = await warrantyState.confirmRework(latestRework?.id);
          if (response) setDialog(null);
        }}
      />
      <RejectWorkModal
        open={dialog === 'reject-rework'}
        title="Reject warranty rework"
        submitting={warrantyState.mutation === 'reject-rework'}
        onClose={() => setDialog(null)}
        onSubmit={async (payload) => {
          const response = await warrantyState.rejectRework(latestRework?.id, payload);
          if (response) setDialog(null);
        }}
      />
    </section>
  );
};

export default WarrantyStage;
