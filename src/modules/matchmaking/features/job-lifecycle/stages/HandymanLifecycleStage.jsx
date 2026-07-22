import React from 'react';
import HandymanAcceptedStage from './accepted/HandymanAcceptedStage';
import HandymanArrivedStage from './arrived/HandymanArrivedStage';
import CancellationReviewStage from './cancellation/CancellationReviewStage';
import HandymanEnRouteStage from './en-route/HandymanEnRouteStage';
import QuotePendingStage from './quote/QuotePendingStage';
import PaymentPendingStage from './payment/PaymentPendingStage';
import InProgressStage from './in-progress/InProgressStage';
import WarrantyStage from './warranty/WarrantyStage';
import CompletedStage from './completed/CompletedStage';

const HandymanLifecycleStage = ({
  allowedActions,
  afterEvidence,
  claimEvidenceState,
  completionState,
  cooldownSeconds,
  details,
  duringEvidence,
  evidenceState,
  mutationState,
  onModal,
  onOpenImage,
  onRefresh,
  paymentState,
  quoteState,
  warrantyEvidenceState,
  warrantyState,
}) => {
  const {
    arrival_policy: policy,
    arrival_request: request,
    cancellation,
    en_route: enRoute,
    job,
  } = details;

  if (job.status === 'CANCELLATION_REVIEW') {
    return (
      <CancellationReviewStage
        allowedActions={allowedActions}
        cancellation={cancellation}
        role="HANDYMAN"
        onConfirm={() => onModal('CONFIRM_CANCELLATION')}
        onReject={() => onModal('REJECT_CANCELLATION')}
        isResponding={mutationState.isRespondingToCancellation}
      />
    );
  }

  if (job.status === 'ACCEPTED') {
    return (
      <HandymanAcceptedStage
        allowedActions={allowedActions}
        isCancelling={mutationState.isCancelling}
        isStartingMoving={mutationState.isStartingMoving}
        onCancel={() => onModal('CANCEL_ACCEPTED')}
        onStartMoving={() => onModal('START_MOVING')}
      />
    );
  }

  if (job.status === 'EN_ROUTE') {
    return (
      <HandymanEnRouteStage
        allowedActions={allowedActions}
        cooldownSeconds={cooldownSeconds}
        enRoute={enRoute}
        policy={policy}
        request={request}
        isCancelling={mutationState.isCancelling}
        isRequestingArrival={mutationState.isRequestingArrival}
        onCancel={() => onModal('REQUEST_CANCELLATION')}
        onRequestArrival={() => onModal('REQUEST_ARRIVAL')}
      />
    );
  }

  if (job.status === 'QUOTE_PENDING') {
    return (
      <QuotePendingStage
        allowedActions={allowedActions}
        evidenceState={evidenceState}
        isCancelling={mutationState.isCancelling}
        isResponding={false}
        onCancel={() => onModal('REQUEST_CANCELLATION')}
        onOpenImage={onOpenImage}
        onRefresh={onRefresh}
        quoteState={quoteState}
        role="HANDYMAN"
      />
    );
  }

  if (job.status === 'PAYMENT_PENDING') {
    return (
      <PaymentPendingStage
        allowedActions={allowedActions}
        evidenceState={evidenceState}
        isCancelling={mutationState.isCancelling}
        onCancel={() => onModal('REQUEST_CANCELLATION')}
        onOpenImage={onOpenImage}
        onPay={() => {}}
        paymentState={paymentState}
        quoteState={quoteState}
        role="HANDYMAN"
      />
    );
  }

  if (job.status === 'IN_PROGRESS') {
    return (
      <InProgressStage
        afterEvidence={afterEvidence}
        allowedActions={allowedActions}
        completionState={completionState}
        contractState={paymentState}
        details={details}
        duringEvidence={duringEvidence}
        onOpenImage={onOpenImage}
        role="HANDYMAN"
      />
    );
  }

  if (job.status === 'WARRANTY') {
    return (
      <WarrantyStage
        allowedActions={allowedActions}
        claimEvidenceState={claimEvidenceState}
        completionState={completionState}
        details={details}
        onOpenImage={onOpenImage}
        onRefresh={onRefresh}
        role="HANDYMAN"
        warrantyEvidenceState={warrantyEvidenceState}
        warrantyState={warrantyState}
      />
    );
  }

  if (job.status === 'CLOSED') {
    return (
      <CompletedStage
        completionState={completionState}
        contractState={paymentState}
        details={details}
        onOpenImage={onOpenImage}
        onRefresh={onRefresh}
        role="HANDYMAN"
        warrantyState={warrantyState}
      />
    );
  }

  return (
    <HandymanArrivedStage
      allowedActions={allowedActions}
      arrivedAt={job.arrived_at}
      evidenceState={evidenceState}
      isCancelling={mutationState.isCancelling}
      onCancel={() => onModal('REQUEST_CANCELLATION')}
      onOpenImage={onOpenImage}
      onRequestSubmit={() => onModal('SUBMIT_QUOTE')}
      quoteState={quoteState}
      quoteSummary={details.inspection_quote}
    />
  );
};

export default HandymanLifecycleStage;
