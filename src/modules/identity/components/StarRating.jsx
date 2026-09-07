import { useState } from 'react';
import './ParticipantUi.scss';

const normalizeRating = (value) => Math.max(0, Math.min(5, Number(value) || 0));

const StarRatingDisplay = ({ value, label, size = 'medium' }) => {
  const rating = normalizeRating(value);
  const rounded = Math.round(rating);
  return (
    <span className={`star-rating-display star-rating-display--${size}`} aria-label={label || `${rating} out of 5 stars`}>
      <span aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= rounded ? 'is-filled' : ''}>★</span>)}
      </span>
    </span>
  );
};

const StarRatingInput = ({ value, onChange, disabled = false, name = 'rating' }) => {
  const [hovered, setHovered] = useState(0);
  const selected = normalizeRating(value);
  const visual = hovered || selected;
  return (
    <fieldset className="star-rating-input" disabled={disabled} onMouseLeave={() => setHovered(0)}>
      <legend>Rating</legend>
      <div role="radiogroup" aria-label="Rating from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} onMouseEnter={() => setHovered(star)}>
            <input
              type="radio"
              name={name}
              value={star}
              checked={selected === star}
              onChange={() => onChange(star)}
            />
            <span aria-hidden="true" className={star <= visual ? 'is-filled' : ''}>★</span>
            <span className="visually-hidden">{star} star{star > 1 ? 's' : ''}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export { StarRatingDisplay, StarRatingInput };
