import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCustomerOverviewApi } from '../../../../identity/services/participantService';
import '../styles/ParticipantOverview.scss';

const money = (value, currency = 'VND') => value == null ? 'Unavailable' : `${new Intl.NumberFormat('en-US').format(value)} ${currency}`;

const CustomerDashboardPage = () => {
  const account = useSelector((state) => state.identity.account);
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', data: null });
  const load = useCallback(async (refreshing = false) => {
    setState((current) => ({ ...current, loading: !current.data, refreshing, error: '' }));
    try {
      const response = await getCustomerOverviewApi();
      setState({ loading: false, refreshing: false, error: '', data: response.DT });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, refreshing: false, error: error?.EM || 'Unable to load your overview.' }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const focus = () => load(true);
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [load]);

  if (state.loading) return <div className="participant-overview__state" role="status">Loading your overview…</div>;
  if (state.error && !state.data) return <div className="participant-overview__state participant-overview__state--error"><p>{state.error}</p><button onClick={() => load()}>Try again</button></div>;
  const data = state.data;
  return <main className="participant-overview">
    <header><div><p className="eyebrow">Customer workspace</p><h1>Welcome back, {account.full_name || 'Customer'}</h1><p>Track the Jobs and actions that need your attention.</p></div><button onClick={() => load(true)} disabled={state.refreshing}>{state.refreshing ? 'Refreshing…' : 'Refresh'}</button></header>
    {state.error && <p className="participant-overview__inline-error" role="alert">{state.error}</p>}
    <section className="participant-overview__metrics" aria-label="Account summary">
      <article><span>Available balance</span><strong>{money(data.wallet?.available_balance, data.wallet?.currency)}</strong><Link to="/customer/wallet">Open wallet</Link></article>
      <article><span>Active Jobs</span><strong>{data.job_summary.active}</strong><Link to="/customer/my-jobs?view=ACTIVE">View active Jobs</Link></article>
      <article><span>Closed Jobs</span><strong>{data.job_summary.closed}</strong><Link to="/customer/my-jobs?view=CLOSED">View history</Link></article>
      <article><span>KYC status</span><strong>{account.kyc_status || 'UNVERIFIED'}</strong><Link to="/customer/profile">Open profile</Link></article>
    </section>
    <div className="participant-overview__columns">
      <section><div className="section-heading"><h2>Action required</h2><span>{data.needs_action.length}</span></div>{data.needs_action.length ? <div className="overview-list">{data.needs_action.map((item) => <Link to={item.destination} key={`${item.job_id}-${item.action_label}`}><div><strong>{item.action_label}</strong><span>{item.service?.name || 'Service Job'} · {item.status}</span></div><time>{new Date(item.updated_at).toLocaleDateString()}</time></Link>)}</div> : <p className="empty-copy">You are all caught up.</p>}</section>
      <section><div className="section-heading"><h2>Recent Jobs</h2><Link to="/customer/my-jobs">View all</Link></div>{data.recent_jobs.length ? <div className="overview-list">{data.recent_jobs.map((item) => <Link to={item.destination} key={item.job_id}><div><strong>{item.service?.name || 'Service Job'}</strong><span>{item.status}{item.review_state === 'PENDING' ? ' · Review pending' : ''}</span></div><time>{new Date(item.updated_at).toLocaleDateString()}</time></Link>)}</div> : <div className="empty-copy"><p>No Jobs yet.</p><Link to="/customer/ai-diagnosis">Post your first Job</Link></div>}</section>
    </div>
  </main>;
};

export default CustomerDashboardPage;
