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
import useJobLifecycle from '../hooks/useJobLifecycle';
import useJobQuote from '../hooks/useJobQuote';
import AcceptedCancellationModal from '../modals/AcceptedCancellationModal';
import ArrivalRequestModal from '../modals/ArrivalRequestModal';
import CancellationResponseModal from '../modals/CancellationResponseModal';
import ConfirmArrivalModal from '../modals/ConfirmArrivalModal';
import LifecycleCancellationModal from '../modals/LifecycleCancellationModal';
import RejectArrivalModal from '../modals/RejectArrivalModal';
import StartMovingModal from '../modals/StartMovingModal';
import SubmitQuoteModal from '../modals/SubmitQuoteModal';
import CustomerLifecycleStage from '../stages/CustomerLifecycleStage';
import HandymanLifecycleStage from '../stages/HandymanLifecycleStage';
import {
  getLegacyJobDetailsPath,
  getLifecycleBackPath,
} from '../utils/jobLifecycleNavigation';
import '../styles/JobLifecycle.scss';

const JobLifecyclePage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { account, token } = useSelector((state) => state.identity);
  const role = String(account?.role || '').toUpperCase();
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const lifecycle = useJobLifecycle({ jobId, accessToken: token, role });
  const canonicalStatus = lifecycle.details?.job?.status;
  const quoteSummary = lifecycle.details?.inspection_quote;
  const quoteDataEnabled = canonicalStatus === 'QUOTE_PENDING'
    || (role === 'HANDYMAN' && canonicalStatus === 'ARRIVED' && Boolean(quoteSummary));
  const evidenceDataEnabled = canonicalStatus === 'QUOTE_PENDING'
    || (role === 'HANDYMAN' && canonicalStatus === 'ARRIVED');
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
                details={lifecycle.details}
                allowedActions={lifecycle.allowedActions}
                evidenceState={evidenceState}
                mutationState={mutationState}
                onModal={lifecycle.openModal}
                onOpenImage={setLightboxSrc}
                quoteState={quoteState}
              />
            ) : (
              <HandymanLifecycleStage
                details={lifecycle.details}
                allowedActions={lifecycle.allowedActions}
                mutationState={mutationState}
                cooldownSeconds={lifecycle.cooldownSeconds}
                evidenceState={evidenceState}
                onModal={lifecycle.openModal}
                onOpenImage={setLightboxSrc}
                quoteState={quoteState}
              />
            )}
          </div>

          <aside className="job-lifecycle__side-column">
            <div className="lifecycle-context-rail">
              <LifecyclePartnerSection partner={partner}>
                <AcceptedJobChat
                  key={jobId}
                  jobId={jobId}
                  jobCode={jobCode}
                  partner={partner}
                  role={role}
                  onRefreshJob={() => lifecycle.refreshDetails({ silent: true })}
                />
              </LifecyclePartnerSection>
              <LifecycleFinancialSummary deposit={deposit} selectedBid={selectedBid} />
            </div>
          </aside>

          <div className="job-lifecycle__details-row">
            <LifecycleJobSummary job={job} onOpenImage={setLightboxSrc} />
          </div>
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

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </main>
  );
};

export default JobLifecyclePage;
