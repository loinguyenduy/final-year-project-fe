import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import ContractReadOnlyView from '../../components/ContractReadOnlyView';
import LifecycleHistoryAccordion from '../../components/LifecycleHistoryAccordion';
import { formatDateTime } from '../../utils/jobLifecycleUi';
import ReviewPanel from './ReviewPanel';

const CompletedStage = ({
  completionState,
  contractState,
  details,
  onOpenImage,
  onRefresh,
  role,
  warrantyState,
}) => {
  const isHandyman = role === 'HANDYMAN';
  const participantResolution = details.warranty?.participant_resolution;
  return (
    <section className="lifecycle-stage lifecycle-stage--completed" aria-labelledby="completed-title">
      <div className="lifecycle-stage__heading">
        <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true"><FaCheckCircle /></span>
        <div>
          <span className="lifecycle-stage__eyebrow">Completed</span>
          <h2 id="completed-title">This Job is complete</h2>
          <p>The warranty lifecycle and payment are complete.</p>
        </div>
      </div>
      <dl className="lifecycle-request-facts">
        <div><dt>Warranty started</dt><dd>{formatDateTime(details.warranty?.started_at)}</dd></div>
        <div><dt>Warranty ended</dt><dd>{formatDateTime(details.warranty?.released_at || details.warranty?.refunded_at)}</dd></div>
        <div><dt>Final status</dt><dd>Completed</dd></div>
      </dl>
      {participantResolution && (
        <div className="lifecycle-notice lifecycle-notice--warning">
          <div>
            <strong>Claim decision: Rejected</strong>
            <p>{participantResolution.message}</p>
          </div>
        </div>
      )}
      <div className="lifecycle-notice lifecycle-notice--success">
        Chat is now read-only. You can still open it to review the conversation history.
      </div>
      <ReviewPanel jobId={details.job.id} reviewState={details.review_state} role={role} onRefresh={onRefresh} />
      <ContractReadOnlyView contract={contractState.contract} />
      {(completionState.loadError || warrantyState.loadError) && (
        <div className="lifecycle-notice lifecycle-notice--danger">
          {completionState.loadError || warrantyState.loadError}
        </div>
      )}
      {(completionState.loading || warrantyState.loading) && (
        <p className="inspection-section__status">Loading lifecycle history…</p>
      )}
      <LifecycleHistoryAccordion
        allowEvidence={isHandyman}
        evidenceByItem={completionState.evidenceByRequest}
        evidenceLoadingKey={completionState.evidenceLoadingId}
        items={completionState.requests}
        onLoadEvidence={completionState.loadRequestEvidence}
        onOpenImage={onOpenImage}
        title="Completion request history"
      />
      <LifecycleHistoryAccordion
        allowEvidence
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
        allowEvidence={isHandyman}
        evidenceByItem={warrantyState.requestEvidence}
        evidenceLoadingKey={warrantyState.evidenceLoadingKey}
        evidenceLoadingPrefix="request:"
        items={warrantyState.requests}
        onLoadEvidence={warrantyState.loadRequestEvidence}
        onOpenImage={onOpenImage}
        title="Warranty completion history"
      />
    </section>
  );
};

export default CompletedStage;
