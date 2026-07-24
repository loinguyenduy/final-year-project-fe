import { useState } from 'react';
import { FaArrowRight, FaCheckCircle, FaClipboardList, FaTools } from 'react-icons/fa';
import AiPriceGuidanceCard from './AiPriceGuidanceCard';
import AiPriceDecisionModal from './AiPriceDecisionModal';
import AiDiagnosisReviewCard from './AiDiagnosisReviewCard';
import {
  formatGuidanceRange,
  formatVndAmount,
  getAiCopy,
} from '../utils/aiJobAssistantPresentation';

const AiJobDraftPanel = ({
  session,
  decisionError,
  diagnosisError,
  language,
  submittingDiagnosis,
  submittingDecision,
  onDiagnosisAction,
  onDecision,
  onContinue,
}) => {
  const [modalMode, setModalMode] = useState(null);
  const actions = new Set(session?.allowed_actions || []);
  const ready = session?.status === 'DRAFT_READY';
  const draft = session?.form_draft || {};
  const estimate = session?.latest_estimate;
  const selectedBudget = session?.selected_budget;
  const diagnosisReview = session?.diagnosis_review;
  const copy = getAiCopy(language);

  return (
    <aside className="ai-draft-panel" aria-labelledby="ai-draft-title">
      <header className="ai-draft-panel__header">
        <span aria-hidden="true"><FaClipboardList /></span>
        <div>
          <h2 id="ai-draft-title">{copy.draftTitle}</h2>
          <p>{ready ? copy.draftReady : copy.draftBuilding}</p>
        </div>
        {ready && <FaCheckCircle className="ai-draft-panel__ready-icon" aria-label={copy.draftReadyState} />}
      </header>

      {diagnosisReview ? (
        <AiDiagnosisReviewCard
          review={diagnosisReview}
          actions={actions}
          language={language}
          submitting={submittingDiagnosis}
          error={diagnosisError}
          onAction={onDiagnosisAction}
        />
      ) : (
        <>
          <div className="ai-draft-section">
            <span className="ai-draft-section__label"><FaTools aria-hidden="true" /> {copy.service}</span>
            {draft.service?.name ? (
              <>
                <strong>{draft.service.name}</strong>
                <small>{draft.service.service_code}</small>
              </>
            ) : (
              <p className="ai-draft-placeholder">{copy.waiting}</p>
            )}
          </div>

          <div className="ai-draft-section">
            <span className="ai-draft-section__label">{copy.problemSummary}</span>
            <p className={draft.issue_description ? 'ai-draft-description' : 'ai-draft-placeholder'}>
              {draft.issue_description || session?.problem_summary || copy.summaryPlaceholder}
            </p>
          </div>
        </>
      )}

      {estimate && <AiPriceGuidanceCard guidance={estimate} compact language={language} />}

      {ready && (
        <div className="ai-selected-decision">
          <span>{copy.priceChoice}</span>
          <strong>
            {selectedBudget?.budget_min && selectedBudget?.budget_max
              ? formatGuidanceRange({
                suggested_min_amount: selectedBudget.budget_min,
                suggested_max_amount: selectedBudget.budget_max,
              })
              : copy.continueWithoutPrice}
          </strong>
          {selectedBudget?.budget_min === selectedBudget?.budget_max && (
            <small>{formatVndAmount(selectedBudget.budget_min)}</small>
          )}
        </div>
      )}

      {!ready && session?.status === 'ESTIMATE_PRESENTED' && (
        <div className="ai-price-actions" aria-label={copy.chooseNext}>
          <h3>{copy.chooseNext}</h3>
          {actions.has('ACCEPT_SUGGESTION') && (
            <button
              type="button"
              className="ai-button ai-button--primary"
              onClick={() => onDecision({ action: 'ACCEPT_SUGGESTION' })}
              disabled={submittingDecision}
            >
              {copy.acceptSuggestion}
            </button>
          )}
          {actions.has('RECALCULATE') && (
            <button
              type="button"
              className="ai-button ai-button--secondary"
              onClick={() => setModalMode('RECALCULATE')}
              disabled={submittingDecision}
            >
              {copy.recalculate}
            </button>
          )}
          {actions.has('USE_OWN_BUDGET') && (
            <button
              type="button"
              className="ai-button ai-button--secondary"
              onClick={() => setModalMode('USE_OWN_BUDGET')}
              disabled={submittingDecision}
            >
              {copy.ownBudget}
            </button>
          )}
          {actions.has('CONTINUE_WITHOUT_ESTIMATE') && (
            <button
              type="button"
              className="ai-text-action ai-text-action--center"
              onClick={() => onDecision({ action: 'CONTINUE_WITHOUT_ESTIMATE' })}
              disabled={submittingDecision}
            >
              {copy.continueWithoutPrice}
            </button>
          )}
        </div>
      )}

      {decisionError && <p className="ai-inline-error" role="alert">{decisionError}</p>}

      {ready && (
        <div className="ai-draft-panel__continue">
          <button type="button" className="ai-button ai-button--primary" onClick={() => onContinue(draft)}>
            {copy.continueToForm} <FaArrowRight aria-hidden="true" />
          </button>
          <p>{copy.formReminder}</p>
        </div>
      )}

      <AiPriceDecisionModal
        key={modalMode || 'closed'}
        open={Boolean(modalMode)}
        mode={modalMode}
        onClose={() => setModalMode(null)}
        onSubmit={onDecision}
        submitting={submittingDecision}
        remainingRecalculations={session?.remaining_recalculations || 0}
        language={language}
      />
    </aside>
  );
};

export default AiJobDraftPanel;
