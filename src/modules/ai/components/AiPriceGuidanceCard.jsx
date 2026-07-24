import { FaChartLine, FaInfoCircle } from 'react-icons/fa';
import {
  formatGuidanceRange,
  formatVndAmount,
  getAiCopy,
  getConfidenceLabel,
} from '../utils/aiJobAssistantPresentation';

const AiPriceGuidanceCard = ({
  guidance,
  compact = false,
  tone = 'customer',
  className = '',
  language = 'EN',
}) => {
  if (!guidance) return null;
  const range = formatGuidanceRange(guidance);
  const copy = getAiCopy(language);
  const confidenceLabel = getConfidenceLabel(guidance.confidence, language);
  const sampleCount = Number(guidance.sample_count || 0);

  return (
    <section className={`ai-price-guidance ai-price-guidance--${tone} ${compact ? 'ai-price-guidance--compact' : ''} ${className}`}>
      <header className="ai-price-guidance__header">
        <span className="ai-price-guidance__icon" aria-hidden="true"><FaChartLine /></span>
        <div>
          <h3>{copy.guidanceTitle}</h3>
          <p>{copy.guidanceSubtitle}</p>
        </div>
      </header>

      {range ? (
        <>
          <div className="ai-price-guidance__range">
            <span>{copy.suggestedRange}</span>
            <strong>{range}</strong>
          </div>
          {guidance.suggested_typical_amount && (
            <div className="ai-price-guidance__typical">
              <span>{copy.typicalAmount}</span>
              <strong>{formatVndAmount(guidance.suggested_typical_amount)}</strong>
            </div>
          )}
          <div className="ai-price-guidance__meta">
            {confidenceLabel && <span>{confidenceLabel}</span>}
            <span>{copy.basedOn(sampleCount)}</span>
          </div>
        </>
      ) : (
        <div className="ai-price-guidance__insufficient">
          {copy.insufficient}
          {sampleCount > 0 && <span> {copy.validSamples(sampleCount)}</span>}
        </div>
      )}

      <p className="ai-price-guidance__reference">
        <FaInfoCircle aria-hidden="true" />
        {copy.referenceOnly}
      </p>
    </section>
  );
};

export default AiPriceGuidanceCard;
