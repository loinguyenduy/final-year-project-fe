import { useMemo, useRef, useState } from 'react';
import ParticipantModal from '../../identity/components/ParticipantModal';
import { createStableUuid, getAiCopy } from '../utils/aiJobAssistantPresentation';

const MAX_BUDGET = 9999999999n;

const AiPriceDecisionModal = ({
  mode,
  open,
  onClose,
  onSubmit,
  submitting,
  remainingRecalculations,
  language,
}) => {
  const [clarification, setClarification] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [error, setError] = useState('');
  const recalculationIdRef = useRef(createStableUuid());

  const copy = getAiCopy(language);
  const english = language === 'EN';
  const title = mode === 'RECALCULATE'
    ? (english ? 'Clarify the Job scope' : 'Bổ sung phạm vi Job')
    : copy.ownBudget;
  const description = mode === 'RECALCULATE'
    ? (english
      ? 'Add a practical detail that may change the scope or difficulty.'
      : 'Bổ sung chi tiết thực tế có thể làm thay đổi phạm vi hoặc độ khó.')
    : (english
      ? 'Enter the range you are comfortable posting. The Handyman still chooses their own Bid.'
      : 'Nhập khoảng ngân sách bạn muốn đăng. Handyman vẫn tự quyết định Bid của họ.');

  const normalizedBudget = useMemo(() => ({
    minimum: budgetMin.replace(/[^\d]/g, ''),
    maximum: budgetMax.replace(/[^\d]/g, ''),
  }), [budgetMax, budgetMin]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (mode === 'RECALCULATE') {
      const normalized = clarification.trim();
      const usefulWords = normalized.split(/\s+/).filter(Boolean);
      if (normalized.length < 15 || usefulWords.length < 3) {
        setError(english
          ? 'Describe a concrete scope, symptom, material or access detail.'
          : 'Hãy mô tả cụ thể phạm vi, dấu hiệu, vật liệu hoặc điều kiện tiếp cận.');
        return;
      }
      const ok = await onSubmit({
        action: 'RECALCULATE',
        clarification: normalized,
        clientMessageId: recalculationIdRef.current,
      });
      if (ok) onClose();
      return;
    }
    if (!normalizedBudget.minimum || !normalizedBudget.maximum) {
      setError(english
        ? 'Enter both the minimum and maximum budget.'
        : 'Hãy nhập cả ngân sách tối thiểu và tối đa.');
      return;
    }
    try {
      const minimum = BigInt(normalizedBudget.minimum);
      const maximum = BigInt(normalizedBudget.maximum);
      if (minimum <= 0n || maximum <= 0n || maximum > MAX_BUDGET || maximum < minimum) {
        setError(english
          ? 'Use a positive VND range where the maximum is at least the minimum.'
          : 'Hãy dùng khoảng VND nguyên dương, trong đó mức tối đa không nhỏ hơn mức tối thiểu.');
        return;
      }
    } catch {
      setError(english ? 'Enter a valid VND budget range.' : 'Hãy nhập khoảng ngân sách VND hợp lệ.');
      return;
    }
    const ok = await onSubmit({
      action: 'USE_OWN_BUDGET',
      budgetMin: normalizedBudget.minimum,
      budgetMax: normalizedBudget.maximum,
    });
    if (ok) onClose();
  };

  return (
    <ParticipantModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      closeDisabled={submitting}
      className="ai-decision-modal"
    >
      <form onSubmit={submit}>
        {mode === 'RECALCULATE' ? (
          <div className="ai-decision-field">
            <label htmlFor="ai-recalculation">
              {english
                ? 'What detail may change the scope or difficulty?'
                : 'Chi tiết nào có thể làm thay đổi phạm vi hoặc độ khó?'}
            </label>
            <textarea
              id="ai-recalculation"
              rows="5"
              maxLength="2000"
              value={clarification}
              onChange={(event) => setClarification(event.target.value)}
              aria-describedby={error ? 'ai-decision-error' : 'ai-recalculation-help'}
              autoFocus
            />
            <div className="ai-decision-field__help" id="ai-recalculation-help">
              <span>
                {english
                  ? `${remainingRecalculations} recalculation${remainingRecalculations === 1 ? '' : 's'} remaining`
                  : `Còn ${remainingRecalculations} lần tính lại`}
              </span>
              <span>{clarification.length}/2000</span>
            </div>
          </div>
        ) : (
          <div className="ai-budget-grid">
            <div className="ai-decision-field">
              <label htmlFor="ai-budget-min">{english ? 'Minimum budget' : 'Ngân sách tối thiểu'}</label>
              <div className="ai-money-input">
                <input
                  id="ai-budget-min"
                  inputMode="numeric"
                  value={budgetMin}
                  onChange={(event) => setBudgetMin(event.target.value)}
                  placeholder="100000"
                  autoFocus
                />
                <span>VND</span>
              </div>
            </div>
            <div className="ai-decision-field">
              <label htmlFor="ai-budget-max">{english ? 'Maximum budget' : 'Ngân sách tối đa'}</label>
              <div className="ai-money-input">
                <input
                  id="ai-budget-max"
                  inputMode="numeric"
                  value={budgetMax}
                  onChange={(event) => setBudgetMax(event.target.value)}
                  placeholder="500000"
                />
                <span>VND</span>
              </div>
            </div>
          </div>
        )}

        {error && <p id="ai-decision-error" className="ai-inline-error" role="alert">{error}</p>}
        <div className="ai-decision-modal__actions">
          <button type="button" className="ai-button ai-button--secondary" onClick={onClose} disabled={submitting}>
            {english ? 'Cancel' : 'Hủy'}
          </button>
          <button type="submit" className="ai-button ai-button--primary" disabled={submitting}>
            {submitting
              ? (english ? 'Saving…' : 'Đang lưu…')
              : mode === 'RECALCULATE'
                ? (english ? 'Recalculate guidance' : 'Tính lại hướng dẫn giá')
                : (english ? 'Use this budget' : 'Dùng ngân sách này')}
          </button>
        </div>
      </form>
    </ParticipantModal>
  );
};

export default AiPriceDecisionModal;
