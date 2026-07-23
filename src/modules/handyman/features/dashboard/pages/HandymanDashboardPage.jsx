import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getHandymanOverviewApi } from '../../../../identity/services/participantService';
import { formatRating, getParticipantStatusLabel } from '../../../../identity/utils/participantDisplay';
import '../../../../customer/features/dashboard/styles/ParticipantOverview.scss';

const money = (value, currency = 'VND') => value == null ? 'Unavailable' : `${new Intl.NumberFormat('en-US').format(value)} ${currency}`;
const HandymanDashboardPage = () => {
  const account = useSelector((state) => state.identity.account);
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', data: null });
  const load = useCallback(async (refreshing = false) => {
    setState((current) => ({ ...current, loading: !current.data, refreshing, error: '' }));
    try { const response = await getHandymanOverviewApi(); setState({ loading: false, refreshing: false, error: '', data: response.DT }); }
    catch (error) { setState((current) => ({ ...current, loading: false, refreshing: false, error: error?.EM || 'Unable to load your overview.' })); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const focus = () => load(true); window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, [load]);
  if (state.loading) return <div className="participant-overview__state" role="status">Loading your overview…</div>;
  if (state.error && !state.data) return <div className="participant-overview__state participant-overview__state--error"><p>{state.error}</p><button onClick={() => load()}>Try again</button></div>;
  const data = state.data;
  return <main className="participant-overview">
    <header><div><p className="eyebrow">Handyman workspace</p><h1>Welcome back, {account.full_name || 'Handyman'}</h1><p>Review assigned Jobs, bids and the work that needs attention.{state.refreshing ? ' Refreshing…' : ''}</p></div></header>
    {account.kyc_status !== 'VERIFIED' && <section className="participant-overview__trust"><strong>Identity verification: {account.kyc_status || 'UNVERIFIED'}</strong><p>Complete or review your KYC information before accepting new work.</p><Link to="/handyman/profile">Open profile</Link></section>}
    <section className="participant-overview__metrics" aria-label="Account summary">
      <article><span>Available balance</span><strong>{money(data.wallet?.available_balance, data.wallet?.currency)}</strong><Link to="/handyman/wallet">Open wallet</Link></article>
      <article><span>Active Jobs</span><strong>{data.job_summary.active}</strong><Link to="/handyman/my-jobs?view=ASSIGNED">View assignments</Link></article>
      <article><span>Active bids</span><strong>{data.active_bid_count}</strong><Link to="/handyman/my-jobs?view=BIDDING">View bids</Link></article>
      <article><span>Rating</span><strong>{formatRating(data.rating_summary)}</strong><span>{data.rating_summary.review_count} reviews</span></article>
    </section>
    <div className="participant-overview__columns">
      <section className="participant-overview__actions"><div className="section-heading"><h2>Action required</h2><span>{data.needs_action.length}</span></div>{data.needs_action.length ? <div className="overview-list">{data.needs_action.map((item) => <Link to={item.destination} key={`${item.job_id}-${item.action_label}`}><div><strong>{item.action_label}</strong><span>{item.service?.name || 'Service Job'} · {getParticipantStatusLabel(item.status)}</span></div><time>{new Date(item.updated_at).toLocaleDateString()}</time></Link>)}</div> : <p className="empty-copy">You are all caught up.</p>}</section>
      <section><div className="section-heading"><h2>Recent assigned Jobs</h2><Link to="/handyman/my-jobs">View all</Link></div>{data.recent_jobs.length ? <div className="overview-list">{data.recent_jobs.map((item) => <Link to={item.destination} key={item.job_id}><div><strong>{item.service?.name || 'Service Job'}</strong><span>{getParticipantStatusLabel(item.status)}{item.review_state === 'PENDING' ? ' · Review pending' : ''}</span></div><time>{new Date(item.updated_at).toLocaleDateString()}</time></Link>)}</div> : <div className="empty-copy"><p>No assigned Jobs yet.</p><Link to="/handyman/find-jobs">Browse available Jobs</Link></div>}</section>
    </div>
  </main>;
};

export default HandymanDashboardPage;
