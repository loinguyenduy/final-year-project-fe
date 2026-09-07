import { FaChartLine } from 'react-icons/fa';
import { formatGuidanceRange } from '../utils/aiJobAssistantPresentation';

const AiPriceGuidanceHint = ({ guidance }) => {
  if (!guidance) return null;
  const range = formatGuidanceRange(guidance);
  return (
    <div className="ai-price-guidance-hint">
      <FaChartLine aria-hidden="true" />
      <span>
        <strong>AI guidance:</strong>{' '}
        {range || 'insufficient comparable data'}
      </span>
    </div>
  );
};

export default AiPriceGuidanceHint;
