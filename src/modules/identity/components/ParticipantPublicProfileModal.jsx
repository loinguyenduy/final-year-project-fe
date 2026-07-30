import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa';
import ParticipantAvatar from './ParticipantAvatar';
import ParticipantModal from './ParticipantModal';
import { StarRatingDisplay } from './StarRating';
import { getPublicProfileApi, getPublicReviewsApi } from '../services/participantService';
import { formatRating } from '../utils/participantDisplay';
import './ParticipantPublicProfileModal.scss';

const ParticipantPublicProfileModal = ({ participantId, onClose }) => {
  const [state, setState] = useState({ loading: true, profile: null, reviews: [], page: 1, hasMore: false, loadingMore: false });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const [profileResponse, reviewsResponse] = await Promise.all([
        getPublicProfileApi(participantId),
        getPublicReviewsApi(participantId, { page: 1, page_size: 5, sort: 'NEWEST' }),
      ]);
      setState({
        loading: false,
        profile: profileResponse.DT,
        reviews: reviewsResponse.DT?.items || [],
        page: 1,
        hasMore: Boolean(reviewsResponse.DT?.pagination?.page < reviewsResponse.DT?.pagination?.total_pages),
        loadingMore: false,
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false }));
      toast.error(error?.EM || 'Unable to load this profile.');
    }
  }, [participantId]);

  useEffect(() => { if (participantId) load(); }, [load, participantId]);

  const loadMore = async () => {
    const nextPage = state.page + 1;
    setState((current) => ({ ...current, loadingMore: true }));
    try {
      const response = await getPublicReviewsApi(participantId, { page: nextPage, page_size: 5, sort: 'NEWEST' });
      const pagination = response.DT?.pagination;
      setState((current) => ({
        ...current,
        reviews: [...current.reviews, ...(response.DT?.items || [])],
        page: nextPage,
        hasMore: Boolean(pagination?.page < pagination?.total_pages),
        loadingMore: false,
      }));
    } catch (error) {
      setState((current) => ({ ...current, loadingMore: false }));
      toast.error(error?.EM || 'Unable to load more reviews.');
    }
  };

  if (!participantId) return null;
  const profile = state.profile;
  const rating = profile?.rating_summary;
  return (
    <ParticipantModal
      title={profile?.role === 'HANDYMAN' ? 'Handyman profile' : 'Customer profile'}
      description="Public participant information. Contact, Wallet and location details are not shown."
      onClose={onClose}
      size="profile"
    >
      {state.loading ? <div className="public-profile-modal__state" role="status">Loading profile…</div> : profile ? (
        <div className="public-profile-modal">
          <section className="public-profile-modal__hero">
            <ParticipantAvatar name={profile.display_name} src={profile.avatar_url} role={profile.role} size="large" />
            <div>
              <p className="public-profile-modal__role">{profile.role === 'HANDYMAN' ? 'Handyman' : 'Customer'}</p>
              <h3>{profile.display_name}</h3>
              <div className="public-profile-modal__rating">
                <strong>{formatRating(rating)}</strong>
                {rating?.review_count > 0 && <FaStar color="#facc15" aria-label="star" />}
                <span>{rating?.review_count || 0} verified reviews</span>
              </div>
            </div>
          </section>

          <section className="public-profile-modal__facts" aria-label="Public profile summary">
            <div><span>Completed Jobs</span><strong>{profile.closed_job_count || 0}</strong></div>
            <div><span>KYC</span><strong>{profile.trust?.kyc_status || 'UNVERIFIED'}</strong></div>
            {profile.role === 'HANDYMAN' && <div><span>Level</span><strong>{profile.trust?.handyman_level || 'C0'}</strong></div>}
            {profile.role === 'HANDYMAN' && <div><span>Security bond</span><strong>{profile.trust?.security_bond_status || 'UNPAID'}</strong></div>}
          </section>

          {profile.bio && <section><h4>About</h4><p>{profile.bio}</p></section>}
          {profile.services?.length > 0 && <section><h4>Services</h4><div className="public-profile-modal__tags">{profile.services.map((service) => <span key={service.id}>{service.name}</span>)}</div></section>}
          {profile.service_areas?.length > 0 && <section><h4>Service areas</h4><div className="public-profile-modal__tags">{profile.service_areas.map((area, index) => <span key={`${area.province || area.province_name}-${area.ward || area.ward_name}-${index}`}>{[area.ward || area.ward_name, area.province || area.province_name].filter(Boolean).join(', ')}</span>)}</div></section>}

          <section>
            <h4>Rating distribution</h4>
            <div className="public-profile-modal__distribution">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = rating?.distribution?.[String(star)] || 0;
                const width = rating?.review_count ? (count / rating.review_count) * 100 : 0;
                return <div key={star}><span>{star} ★</span><i><b style={{ width: `${width}%` }} /></i><strong>{count}</strong></div>;
              })}
            </div>
          </section>

          <section>
            <h4>Verified Job Reviews</h4>
            {state.reviews.length ? <div className="public-profile-modal__reviews">{state.reviews.map((review) => (
              <article key={review.review_id}>
                <div><strong>{review.reviewer?.display_name || 'Participant'}</strong><StarRatingDisplay value={review.rating} size="small" /></div>
                {review.comment && <p>{review.comment}</p>}
                <small>{new Date(review.created_at).toLocaleDateString()} · Verified Job Review{review.service?.name ? ` · ${review.service.name}` : ''}</small>
              </article>
            ))}</div> : <p>No reviews yet.</p>}
            {state.hasMore && <button type="button" className="public-profile-modal__more" onClick={loadMore} disabled={state.loadingMore}>{state.loadingMore ? 'Loading…' : 'Load more reviews'}</button>}
          </section>
        </div>
      ) : <div className="public-profile-modal__state" role="alert">Profile not found.</div>}
    </ParticipantModal>
  );
};

export default ParticipantPublicProfileModal;
