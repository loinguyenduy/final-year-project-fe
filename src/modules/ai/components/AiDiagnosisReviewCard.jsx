import { FaCheckCircle, FaClipboardCheck, FaPen } from 'react-icons/fa';
import { getAiCopy } from '../utils/aiJobAssistantPresentation';

const AiDiagnosisReviewCard = ({
  review,
  actions,
  language,
  submitting,
  error,
  onAction,
}) => {
  if (!review) return null;
  const copy = getAiCopy(language);
  const confirmed = review.confirmation_status === 'CONFIRMED';
  const localizeLevel = (value) => {
    if (language === 'EN') return value;
    return ({
      LOW: 'Thấp',
      NORMAL: 'Bình thường',
      MEDIUM: 'Trung bình',
      HIGH: 'Cao',
      EMERGENCY: 'Khẩn cấp',
    }[value] || value);
  };
  const fields = [
    review.service?.name
      ? { label: copy.service, value: review.service.name }
      : null,
    review.device_or_work_area
      ? { label: copy.device, value: review.device_or_work_area }
      : null,
    review.main_problem
      ? { label: copy.mainProblem, value: review.main_problem }
      : null,
    review.symptoms?.length
      ? { label: copy.symptoms, value: review.symptoms.join(', ') }
      : null,
    review.device_age_or_usage_duration
      ? { label: copy.age, value: review.device_age_or_usage_duration }
      : null,
    review.severity
      ? { label: copy.severity, value: localizeLevel(review.severity) }
      : null,
    review.urgency
      ? { label: copy.urgency, value: localizeLevel(review.urgency) }
      : null,
    review.issue_description
      ? { label: copy.normalizedDescription, value: review.issue_description, wide: true }
      : null,
  ].filter(Boolean);

  return (
    <section className={`ai-diagnosis-review ${confirmed ? 'is-confirmed' : ''}`} aria-labelledby="ai-diagnosis-review-title">
      <header className="ai-diagnosis-review__header">
        <span aria-hidden="true">{confirmed ? <FaCheckCircle /> : <FaClipboardCheck />}</span>
        <div>
          <h3 id="ai-diagnosis-review-title">
            {confirmed ? copy.diagnosisConfirmed : copy.diagnosisTitle}
          </h3>
          {!confirmed && <p>{copy.diagnosisPrompt}</p>}
        </div>
      </header>

      <dl className="ai-diagnosis-review__fields">
        {fields.map((field) => (
          <div key={field.label} className={field.wide ? 'is-wide' : ''}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>

      <div className="ai-diagnosis-review__actions">
        {actions.has('CONFIRM_DIAGNOSIS') && (
          <button
            type="button"
            className="ai-button ai-button--primary"
            onClick={() => onAction('CONFIRM_DIAGNOSIS')}
            disabled={submitting}
          >
            <FaCheckCircle aria-hidden="true" /> {copy.confirmDiagnosis}
          </button>
        )}
        {actions.has('CORRECT_DIAGNOSIS') && (
          <button
            type="button"
            className="ai-button ai-button--secondary"
            onClick={() => onAction('CORRECT_DIAGNOSIS')}
            disabled={submitting}
          >
            <FaPen aria-hidden="true" />
            {confirmed ? copy.editDiagnosis : copy.correctDiagnosis}
          </button>
        )}
      </div>
      {error && <p className="ai-inline-error" role="alert">{error}</p>}
    </section>
  );
};

export default AiDiagnosisReviewCard;
