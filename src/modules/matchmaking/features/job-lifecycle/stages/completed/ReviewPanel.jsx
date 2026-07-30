import { useState } from 'react';
import { toast } from 'react-toastify';
import { submitReviewApi } from '../../../../../identity/services/participantService';
import { StarRatingDisplay, StarRatingInput } from '../../../../../identity/components/StarRating';

const ReviewPanel = ({ jobId, reviewState, role, onRefresh }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!reviewState || reviewState.status === 'NOT_AVAILABLE') return null;
  if (reviewState.status === 'SUBMITTED') return <section className="job-review-panel" aria-labelledby="your-review-title">
    <h3 id="your-review-title">Your review</h3><StarRatingDisplay value={reviewState.review.rating} />{reviewState.review.comment && <p>{reviewState.review.comment}</p>}<small>Verified Job Review · Reviews cannot be edited or deleted.</small>
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
    <StarRatingInput value={rating} onChange={setRating} disabled={submitting} name={`job-rating-${jobId}`} />
    <label htmlFor="review-comment">Comment <span>(optional)</span></label><textarea id="review-comment" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} rows={4} /><div className="job-review-panel__footer"><small>{comment.length}/1000</small><button type="submit" disabled={submitting || !rating}>{submitting ? 'Publishing…' : 'Publish review'}</button></div>
  </form></section>;
};

export default ReviewPanel;
