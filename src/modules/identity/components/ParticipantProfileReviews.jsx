import { useEffect, useState } from 'react';
import { getPublicReviewsApi } from '../services/participantService';
import { formatRating } from '../utils/participantDisplay';
import { StarRatingDisplay } from './StarRating';
import './ParticipantProfileReviews.scss';

const ParticipantProfileReviews = ({ userId, ratingSummary }) => {
  const [state, setState] = useState({ loading: true, error: '', items: [], page: 1, totalPages: 1, loadingMore: false });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    getPublicReviewsApi(userId, { page: 1, page_size: 10, sort: 'NEWEST' })
      .then((response) => {
        if (!active) return;
        setState({ loading: false, error: '', items: response.DT?.items || [], page: 1, totalPages: response.DT?.pagination?.total_pages || 1, loadingMore: false });
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, loading: false, error: error?.EM || 'Unable to load reviews.' }));
      });
    return () => { active = false; };
  }, [userId]);

  const loadMore = async () => {
    const page = state.page + 1;
    setState((current) => ({ ...current, loadingMore: true }));
    try {
      const response = await getPublicReviewsApi(userId, { page, page_size: 10, sort: 'NEWEST' });
      setState((current) => ({ ...current, items: [...current.items, ...(response.DT?.items || [])], page, totalPages: response.DT?.pagination?.total_pages || page, loadingMore: false }));
    } catch (error) {
      setState((current) => ({ ...current, error: error?.EM || 'Unable to load more reviews.', loadingMore: false }));
    }
  };

  return (
    <section className="participant-profile-reviews" aria-labelledby="profile-reviews-title">
      <header>
        <div><p>Verified Job rating</p><h2 id="profile-reviews-title">{formatRating(ratingSummary)}</h2><span>{ratingSummary?.review_count || 0} reviews</span></div>
        <StarRatingDisplay value={ratingSummary?.average_rating || 0} size="large" />
      </header>
      <div className="participant-profile-reviews__distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingSummary?.distribution?.[String(star)] || 0;
          const width = ratingSummary?.review_count ? (count / ratingSummary.review_count) * 100 : 0;
          return <div key={star}><span>{star} ★</span><i><b style={{ width: `${width}%` }} /></i><strong>{count}</strong></div>;
        })}
      </div>
      {state.loading ? <p role="status">Loading reviews…</p> : state.error && !state.items.length ? <p role="alert">{state.error}</p> : state.items.length ? (
        <div className="participant-profile-reviews__list">
          {state.items.map((review) => <article key={review.review_id}>
            <div><strong>{review.reviewer?.display_name || 'Participant'}</strong><StarRatingDisplay value={review.rating} size="small" /></div>
            {review.comment && <p>{review.comment}</p>}
            <small>{new Date(review.created_at).toLocaleDateString()} · Verified Job Review{review.service?.name ? ` · ${review.service.name}` : ''}</small>
          </article>)}
        </div>
      ) : <p>No reviews yet.</p>}
      {state.error && state.items.length > 0 && <p role="alert">{state.error}</p>}
      {state.page < state.totalPages && <button type="button" onClick={loadMore} disabled={state.loadingMore}>{state.loadingMore ? 'Loading…' : 'Load more reviews'}</button>}
    </section>
  );
};

export default ParticipantProfileReviews;
