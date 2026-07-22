import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProfileApi, getPublicReviewsApi } from '../../../services/participantService';
import './PublicProfilePage.scss';

const ratingText = (rating) => rating?.rating_status === 'AVAILABLE' ? `${rating.bayesian_rating} / 5` : rating?.rating_status === 'INSUFFICIENT_PRIOR_SAMPLE' ? 'Rating developing' : 'No reviews yet';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => {
    let active = true;
    Promise.all([getPublicProfileApi(userId), getPublicReviewsApi(userId, { page: 1, page_size: 10, sort: 'NEWEST' })]).then(([profileResponse, reviewResponse]) => {
      if (!active) return;
      setProfile(profileResponse.DT); setReviews(reviewResponse.DT.items); setHasMore(reviewResponse.DT.pagination.page < reviewResponse.DT.pagination.total_pages); setState({ loading: false, error: '' });
    }).catch((error) => { if (active) setState({ loading: false, error: error?.EM || 'Unable to load this profile.' }); });
    return () => { active = false; };
  }, [userId]);
  const loadMore = async () => {
    const next = page + 1;
    const response = await getPublicReviewsApi(userId, { page: next, page_size: 10, sort: 'NEWEST' });
    setReviews((current) => [...current, ...response.DT.items]); setPage(next); setHasMore(next < response.DT.pagination.total_pages);
  };
  if (state.loading) return <main className="public-profile-state" role="status">Loading public profile…</main>;
  if (state.error || !profile) return <main className="public-profile-state"><p>{state.error}</p><Link to="/">Go back</Link></main>;
  return <main className="public-profile"><header><div className="public-profile__avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.display_name?.charAt(0)}</div><div><span>{profile.role}</span><h1>{profile.display_name}</h1><p>Member since {new Date(profile.member_since).toLocaleDateString()}</p></div></header>
    <section className="public-profile__summary"><div><span>Bayesian rating</span><strong>{ratingText(profile.rating_summary)}</strong><small>{profile.rating_summary.review_count} verified reviews</small></div><div><span>Closed Jobs</span><strong>{profile.closed_job_count}</strong></div><div><span>Trust</span><strong>{profile.trust.kyc_status}</strong>{profile.trust.handyman_level && <small>Level {profile.trust.handyman_level}</small>}</div></section>
    {profile.bio && <section><h2>About</h2><p>{profile.bio}</p></section>}
    {profile.services?.length > 0 && <section><h2>Services</h2><div className="public-profile__chips">{profile.services.map((service) => <span key={service.id}>{service.name}</span>)}</div></section>}
    <section><h2>Verified Job Reviews</h2>{reviews.length ? <div className="public-review-list">{reviews.map((review) => <article key={review.review_id}><div><strong>{review.reviewer.display_name}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div>{review.comment && <p>{review.comment}</p>}<small>{new Date(review.created_at).toLocaleDateString()} · Verified Job Review{review.service?.name ? ` · ${review.service.name}` : ''}</small></article>)}</div> : <p>No reviews yet.</p>}{hasMore && <button onClick={loadMore}>Load more reviews</button>}</section>
  </main>;
};

export default PublicProfilePage;
