import React from 'react';
import CustomerAcceptedStage from './accepted/CustomerAcceptedStage';
import CustomerArrivedStage from './arrived/CustomerArrivedStage';
import CancellationReviewStage from './cancellation/CancellationReviewStage';
import CustomerEnRouteStage from './en-route/CustomerEnRouteStage';
import QuotePendingStage from './quote/QuotePendingStage';
import PaymentPendingStage from './payment/PaymentPendingStage';
import InProgressStage from './in-progress/InProgressStage';
import WarrantyStage from './warranty/WarrantyStage';
import CompletedStage from './completed/CompletedStage';

const CustomerLifecycleStage = ({
  allowedActions,
  afterEvidence,
  claimEvidenceState,
  completionState,
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
        role="CUSTOMER"
        onConfirm={() => onModal('CONFIRM_CANCELLATION')}
        onReject={() => onModal('REJECT_CANCELLATION')}
        isResponding={mutationState.isRespondingToCancellation}
      />
    );
  }

  if (job.status === 'ACCEPTED') {
    return (
      <CustomerAcceptedStage
        allowedActions={allowedActions}
        isCancelling={mutationState.isCancelling}
        onCancel={() => onModal('CANCEL_ACCEPTED')}
        onReopen={() => onModal('REOPEN_BIDDING')}
      />
    );
  }

  if (job.status === 'EN_ROUTE') {
    return (
      <CustomerEnRouteStage
        allowedActions={allowedActions}
        enRoute={enRoute}
        request={request}
        isCancelling={mutationState.isCancelling}
        isConfirmingArrival={mutationState.isConfirmingArrival}
        isRejectingArrival={mutationState.isRejectingArrival}
        onCancel={() => onModal('REQUEST_CANCELLATION')}
        onConfirmArrival={() => onModal('CONFIRM_ARRIVAL')}
        onRejectArrival={() => onModal('REJECT_ARRIVAL')}
      />
    );
  }

  if (job.status === 'QUOTE_PENDING') {
    return (
      <QuotePendingStage
        allowedActions={allowedActions}
        evidenceState={evidenceState}
        isCancelling={mutationState.isCancelling}
        isResponding={paymentState.accepting || paymentState.rejecting}
        onAccept={() => onModal('ACCEPT_QUOTE')}
        onCancel={() => onModal('REQUEST_CANCELLATION')}
        onOpenImage={onOpenImage}
        onRefresh={onRefresh}
        onReject={() => onModal('REJECT_QUOTE')}
        quoteState={quoteState}
        role="CUSTOMER"
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
        onPay={() => onModal('PAY_REMAINING')}
        paymentState={paymentState}
        quoteState={quoteState}
        role="CUSTOMER"
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
        role="CUSTOMER"
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
        role="CUSTOMER"
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
        role="CUSTOMER"
        warrantyState={warrantyState}
      />
    );
  }

  return (
    <CustomerArrivedStage
      allowedActions={allowedActions}
      arrivedAt={job.arrived_at}
      isCancelling={mutationState.isCancelling}
      onCancel={() => onModal('REQUEST_CANCELLATION')}
    />
  );
};

export default CustomerLifecycleStage;
