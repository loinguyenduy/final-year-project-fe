import { useState } from 'react';
import { toast } from 'react-toastify';
import { submitReviewApi } from '../../../../../identity/services/participantService';

const ReviewPanel = ({ jobId, reviewState, role, onRefresh }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!reviewState || reviewState.status === 'NOT_AVAILABLE') return null;
  if (reviewState.status === 'SUBMITTED') return <section className="job-review-panel" aria-labelledby="your-review-title">
    <h3 id="your-review-title">Your review</h3><div className="job-review-panel__stars" aria-label={`${reviewState.review.rating} out of 5 stars`}>{'★'.repeat(reviewState.review.rating)}{'☆'.repeat(5 - reviewState.review.rating)}</div>{reviewState.review.comment && <p>{reviewState.review.comment}</p>}<small>Verified Job Review · Reviews cannot be edited or deleted.</small>
  </section>;
  const submit = async (event) => {
    event.preventDefault();
    if (!rating) { toast.error('Choose a rating from 1 to 5 stars.'); return; }
    setSubmitting(true);
    try { await submitReviewApi(jobId, { rating, comment }); toast.success('Your review was published.'); await onRefresh?.({ silent: true }); }
    catch (error) { toast.error(error?.EM || 'Unable to submit the review.'); if (error?.code === 'JOB_REVIEW_ALREADY_SUBMITTED') await onRefresh?.({ silent: true }); }
    finally { setSubmitting(false); }
  };
  return <section className="job-review-panel" aria-labelledby="job-review-title"><div><span className="lifecycle-stage__eyebrow">Verified Job Review</span><h3 id="job-review-title">{role === 'CUSTOMER' ? 'Rate your handyman' : 'Rate this customer'}</h3><p>Share a fair review of your completed Job with {reviewState.reviewee?.display_name || 'the other participant'}.</p></div><form onSubmit={submit}>
    <fieldset disabled={submitting}><legend>Rating</legend><div className="job-review-panel__input">{[1,2,3,4,5].map((value) => <label key={value}><input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} /><span aria-hidden="true">★</span><span className="visually-hidden">{value} star{value > 1 ? 's' : ''}</span></label>)}</div></fieldset>
    <label htmlFor="review-comment">Comment <span>(optional)</span></label><textarea id="review-comment" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} rows={4} /><div className="job-review-panel__footer"><small>{comment.length}/1000</small><button type="submit" disabled={submitting || !rating}>{submitting ? 'Publishing…' : 'Publish review'}</button></div>
  </form></section>;
};

export default ReviewPanel;
