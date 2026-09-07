import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaRedo } from 'react-icons/fa';
import AcceptedJobChat from '../../../../chat/components/AcceptedJobChat';
import ImageLightbox from '../../../../../core/components/ImageLightbox';
import JobProgressStepper from '../../../components/JobProgressStepper';
import { resolveEffectiveJobProgressStatus } from '../../../utils/jobProgress';
import LifecycleErrorState from '../components/LifecycleErrorState';
import LifecycleFinancialSummary from '../components/LifecycleFinancialSummary';
import LifecycleHeader from '../components/LifecycleHeader';
import LifecycleJobSummary from '../components/LifecycleJobSummary';
import LifecycleLoadingState from '../components/LifecycleLoadingState';
import LifecyclePartnerSection from '../components/LifecyclePartnerSection';
import useBeforeEvidence from '../hooks/useBeforeEvidence';
import useCompletionLifecycle from '../hooks/useCompletionLifecycle';
import useJobLifecycle from '../hooks/useJobLifecycle';
import useJobQuote from '../hooks/useJobQuote';
import useQuotePayment from '../hooks/useQuotePayment';
import useWarrantyLifecycle from '../hooks/useWarrantyLifecycle';
import useWorkEvidence from '../hooks/useWorkEvidence';
import AcceptQuoteModal from '../modals/AcceptQuoteModal';
import AcceptedCancellationModal from '../modals/AcceptedCancellationModal';
import ArrivalRequestModal from '../modals/ArrivalRequestModal';
import CancellationResponseModal from '../modals/CancellationResponseModal';
import ConfirmArrivalModal from '../modals/ConfirmArrivalModal';
import LifecycleCancellationModal from '../modals/LifecycleCancellationModal';
import RejectArrivalModal from '../modals/RejectArrivalModal';
import RejectQuoteModal from '../modals/RejectQuoteModal';
import RemainingPaymentModal from '../modals/RemainingPaymentModal';
import StartMovingModal from '../modals/StartMovingModal';
import SubmitQuoteModal from '../modals/SubmitQuoteModal';
import CustomerLifecycleStage from '../stages/CustomerLifecycleStage';
import HandymanLifecycleStage from '../stages/HandymanLifecycleStage';
import {
  getLegacyJobDetailsPath,
  getLifecycleBackPath,
} from '../utils/jobLifecycleNavigation';
import '../styles/JobLifecycle.scss';

const calculateAcceptanceAmounts = (quoteTotal, depositAmount) => {
  try {
    const total = BigInt(String(quoteTotal));
    const deposit = BigInt(String(depositAmount));
    if (total < deposit || total < 0n || deposit < 0n) return null;
    return {
      quoteTotal: total.toString(),
      deposit: deposit.toString(),
      remaining: (total - deposit).toString(),
    };
  } catch {
    return null;
  }
};

const JobLifecyclePage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { account, token } = useSelector((state) => state.identity);
  const role = String(account?.role || '').toUpperCase();
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const lifecycle = useJobLifecycle({ jobId, accessToken: token, role });
  const canonicalStatus = lifecycle.details?.job?.status;
  const quoteSummary = lifecycle.details?.inspection_quote;
  const quoteDataEnabled = ['QUOTE_PENDING', 'PAYMENT_PENDING'].includes(canonicalStatus)
    || (role === 'HANDYMAN' && canonicalStatus === 'ARRIVED' && Boolean(quoteSummary));
  const evidenceDataEnabled = role === 'HANDYMAN'
    && ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'].includes(canonicalStatus);
  const quoteState = useJobQuote({
    enabled: quoteDataEnabled,
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
  });
  const evidenceState = useBeforeEvidence({
    enabled: evidenceDataEnabled,
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
  });
  const paymentState = useQuotePayment({
    contractEnabled: ['IN_PROGRESS', 'WARRANTY', 'CLOSED'].includes(canonicalStatus),
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    onCancelled: () => lifecycle.exitWorkspace('CANCELLED'),
    paymentEnabled: canonicalStatus === 'PAYMENT_PENDING',
  });
  const duringEvidence = useWorkEvidence({
    enabled: role === 'HANDYMAN' && canonicalStatus === 'IN_PROGRESS',
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    stage: 'DURING',
  });
  const afterEvidence = useWorkEvidence({
    enabled: role === 'HANDYMAN' && canonicalStatus === 'IN_PROGRESS',
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    stage: 'AFTER',
  });
  const claimEvidenceState = useWorkEvidence({
    enabled: role === 'CUSTOMER'
      && canonicalStatus === 'WARRANTY'
      && lifecycle.details?.warranty?.status === 'ACTIVE',
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    stage: 'WARRANTY_CLAIM',
  });
  const warrantyEvidenceState = useWorkEvidence({
    enabled: role === 'HANDYMAN'
      && canonicalStatus === 'WARRANTY'
      && lifecycle.details?.warranty?.status === 'REWORK_REQUIRED',
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    stage: 'WARRANTY',
  });
  const completionState = useCompletionLifecycle({
    enabled: ['IN_PROGRESS', 'WARRANTY', 'CLOSED'].includes(canonicalStatus),
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    refreshKey: [
      lifecycle.details?.completion?.latest_request?.id,
      lifecycle.details?.completion?.latest_request?.status,
      lifecycle.details?.completion?.latest_request?.responded_at,
    ].join(':'),
  });
  const warrantyState = useWarrantyLifecycle({
    enabled: ['WARRANTY', 'CLOSED'].includes(canonicalStatus),
    jobId,
    onCanonicalRefresh: lifecycle.refreshDetails,
    refreshKey: [
      lifecycle.details?.warranty?.status,
      lifecycle.details?.warranty?.latest_claim?.id,
      lifecycle.details?.warranty?.latest_claim?.status,
      lifecycle.details?.warranty?.latest_rework_request?.id,
      lifecycle.details?.warranty?.latest_rework_request?.status,
    ].join(':'),
  });
  const refreshBeforeEvidence = evidenceState.refreshEvidence;
  const refreshQuote = quoteState.refreshQuote;
  const refreshLifecycleDetails = lifecycle.refreshDetails;

  useEffect(() => {
    if (canonicalStatus !== 'PAYMENT_PENDING') return;
    void Promise.all([
      refreshQuote({ silent: true }),
      refreshBeforeEvidence({ silent: true }),
    ]);
  }, [canonicalStatus, refreshBeforeEvidence, refreshQuote]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshLifecycleDetails({ silent: true });
      }
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshLifecycleDetails]);

  useEffect(() => {
    if (!lifecycle.outsideStatus) return;
    navigate(getLegacyJobDetailsPath({ jobId, role }), {
      replace: true,
      state: { lifecycleExitStatus: lifecycle.outsideStatus },
    });
  }, [jobId, lifecycle.outsideStatus, navigate, role]);

  const goBack = () => navigate(getLifecycleBackPath(role));

  if (lifecycle.detailsLoading && !lifecycle.details) {
    return (
      <main className={`job-lifecycle job-lifecycle--${role.toLowerCase()}`}>
        <div className="job-lifecycle__container"><LifecycleLoadingState /></div>
      </main>
    );
  }

  if (lifecycle.detailsError || !lifecycle.details) {
    return (
      <main className={`job-lifecycle job-lifecycle--${role.toLowerCase()}`}>
        <div className="job-lifecycle__container">
          <LifecycleErrorState
            message={lifecycle.detailsError || 'Lifecycle data is unavailable.'}
            onBack={goBack}
            onRetry={() => lifecycle.refreshDetails()}
          />
        </div>
      </main>
    );
  }

  const {
    cancellation,
    deposit,
    job,
    partner,
    selected_bid: selectedBid,
  } = lifecycle.details;
  const { activeModal, mutationState } = lifecycle;
  const jobCode = `JOB-${job.id.slice(0, 4).toUpperCase()}`;
  const effectiveStepperStatus = resolveEffectiveJobProgressStatus({
    currentStatus: job.status,
    cancellation,
  });
  const acceptedCancellationOpen = activeModal === 'CANCEL_ACCEPTED'
    || activeModal === 'REOPEN_BIDDING';

  const submitAcceptedCancellation = (payload) => (
    role === 'CUSTOMER'
      ? lifecycle.actions.cancelAcceptedCustomer(payload)
      : lifecycle.actions.cancelAcceptedHandyman(payload)
  );

  return (
    <main className={`job-lifecycle job-lifecycle--${role.toLowerCase()}`}>
      <div className="job-lifecycle__container">
        <LifecycleHeader
          job={job}
          role={role}
          socketState={lifecycle.socketConnectionState}
          onBack={goBack}
        />

        <div className="lifecycle-progress">
          <JobProgressStepper
            ariaLabel="Active job progress"
            currentStatus={effectiveStepperStatus}
          />
        </div>

        {lifecycle.syncError && (
          <div className="lifecycle-sync-error" role="alert">
            <span>{lifecycle.syncError}</span>
            <button type="button" onClick={() => lifecycle.refreshDetails({ silent: true })}>
              <FaRedo aria-hidden="true" />
              Sync latest details
            </button>
          </div>
        )}

        <div className="job-lifecycle__grid">
          <div className="job-lifecycle__main-column">
            {role === 'CUSTOMER' ? (
              <CustomerLifecycleStage
                afterEvidence={afterEvidence}
                details={lifecycle.details}
                allowedActions={lifecycle.allowedActions}
                claimEvidenceState={claimEvidenceState}
                completionState={completionState}
                duringEvidence={duringEvidence}
                evidenceState={evidenceState}
                mutationState={mutationState}
                onModal={lifecycle.openModal}
                onOpenImage={setLightboxSrc}
                onRefresh={() => Promise.all([
                  lifecycle.refreshDetails({ silent: true }),
                  warrantyState.refreshHistory({ silent: true }),
                ])}
                paymentState={paymentState}
                quoteState={quoteState}
                warrantyEvidenceState={warrantyEvidenceState}
                warrantyState={warrantyState}
              />
            ) : (
              <HandymanLifecycleStage
                afterEvidence={afterEvidence}
                details={lifecycle.details}
                claimEvidenceState={claimEvidenceState}
                completionState={completionState}
                duringEvidence={duringEvidence}
                allowedActions={lifecycle.allowedActions}
                mutationState={mutationState}
                cooldownSeconds={lifecycle.cooldownSeconds}
                evidenceState={evidenceState}
                onModal={lifecycle.openModal}
                onOpenImage={setLightboxSrc}
                onRefresh={() => Promise.all([
                  lifecycle.refreshDetails({ silent: true }),
                  warrantyState.refreshHistory({ silent: true }),
                ])}
                paymentState={paymentState}
                quoteState={quoteState}
                warrantyEvidenceState={warrantyEvidenceState}
                warrantyState={warrantyState}
              />
            )}
            <div className="job-lifecycle__details-row">
              <LifecycleJobSummary job={job} onOpenImage={setLightboxSrc} />
            </div>
          </div>

          <aside className="job-lifecycle__side-column">
            <div className="lifecycle-context-rail">
              <LifecyclePartnerSection partner={partner}>
                <AcceptedJobChat
                  key={jobId}
                  jobId={jobId}
                  jobCode={jobCode}
                  jobStatus={job.status}
                  partner={partner}
                  role={role}
                  onRefreshJob={() => lifecycle.refreshDetails({ silent: true })}
                />
              </LifecyclePartnerSection>
              <LifecycleFinancialSummary
                deposit={deposit}
                jobStatus={job.status}
                selectedBid={selectedBid}
                warranty={lifecycle.details.warranty}
              />
            </div>
          </aside>
        </div>
      </div>

      <StartMovingModal
        open={activeModal === 'START_MOVING'}
        onClose={lifecycle.closeModal}
        onSubmit={lifecycle.actions.startMoving}
        hasJobCoordinates={lifecycle.hasJobCoordinates}
        submitting={mutationState.isStartingMoving}
      />
      <ArrivalRequestModal
        open={activeModal === 'REQUEST_ARRIVAL'}
        onClose={lifecycle.closeModal}
        onSubmit={lifecycle.actions.createArrival}
        hasJobCoordinates={lifecycle.hasJobCoordinates}
        submitting={mutationState.isRequestingArrival}
      />
      <ConfirmArrivalModal
        open={activeModal === 'CONFIRM_ARRIVAL'}
        onClose={lifecycle.closeModal}
        submitting={mutationState.isConfirmingArrival}
        onConfirm={async () => {
          const response = await lifecycle.actions.confirmArrival(
            lifecycle.details.arrival_request?.id,
          );
          if (response) lifecycle.closeModal();
        }}
      />
      <RejectArrivalModal
        open={activeModal === 'REJECT_ARRIVAL'}
        onClose={lifecycle.closeModal}
        submitting={mutationState.isRejectingArrival}
        onSubmit={(payload) => lifecycle.actions.rejectArrival(
          lifecycle.details.arrival_request?.id,
          payload,
        )}
      />
      <AcceptedCancellationModal
        open={acceptedCancellationOpen}
        onClose={lifecycle.closeModal}
        onSubmit={submitAcceptedCancellation}
        role={role}
        actionType={activeModal === 'REOPEN_BIDDING' ? 'REOPEN_BIDDING' : 'CANCEL_JOB'}
        submitting={mutationState.isCancelling}
      />
      <LifecycleCancellationModal
        open={activeModal === 'REQUEST_CANCELLATION'}
        onClose={lifecycle.closeModal}
        onSubmit={lifecycle.actions.createCancellation}
        role={role}
        phase={job.status}
        depositAmount={deposit?.amount}
        submitting={mutationState.isCancelling}
      />
      <CancellationResponseModal
        open={activeModal === 'CONFIRM_CANCELLATION' || activeModal === 'REJECT_CANCELLATION'}
        onClose={lifecycle.closeModal}
        mode={activeModal === 'CONFIRM_CANCELLATION' ? 'CONFIRM' : 'REJECT'}
        cancellation={cancellation}
        submitting={mutationState.isRespondingToCancellation}
        onSubmit={(payload) => (
          activeModal === 'CONFIRM_CANCELLATION'
            ? lifecycle.actions.confirmCancellation(cancellation?.cancellation_id)
            : lifecycle.actions.rejectCancellation(cancellation?.cancellation_id, payload)
        )}
      />
      <SubmitQuoteModal
        open={activeModal === 'SUBMIT_QUOTE'}
        onClose={lifecycle.closeModal}
        quote={quoteState.quote}
        submitting={quoteState.submitting}
        onConfirm={async () => {
          const response = await quoteState.submitSavedDraft({
            allowed: lifecycle.allowedActions.includes('SUBMIT_QUOTE'),
          });
          if (response) lifecycle.closeModal();
        }}
      />
      <AcceptQuoteModal
        open={activeModal === 'ACCEPT_QUOTE'}
        onClose={lifecycle.closeModal}
        submitting={paymentState.accepting}
        amounts={calculateAcceptanceAmounts(
          quoteState.quote?.total_amount,
          deposit?.amount,
        )}
        onConfirm={async () => {
          const response = await paymentState.acceptQuote(quoteState.quote?.id);
          if (response) lifecycle.closeModal();
        }}
      />
      <RejectQuoteModal
        open={activeModal === 'REJECT_QUOTE'}
        onClose={lifecycle.closeModal}
        submitting={paymentState.rejecting}
        depositAmount={deposit?.amount}
        onSubmit={(payload) => paymentState.rejectQuote(quoteState.quote?.id, payload)}
      />
      <RemainingPaymentModal
        open={activeModal === 'PAY_REMAINING'}
        onClose={lifecycle.closeModal}
        submitting={paymentState.paying}
        payment={paymentState.payment || lifecycle.details.payment}
        insufficientBalance={paymentState.insufficientBalance}
        onConfirm={async () => {
          const response = await paymentState.completePayment();
          if (response) lifecycle.closeModal();
        }}
      />

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </main>
  );
};

export default JobLifecyclePage;
