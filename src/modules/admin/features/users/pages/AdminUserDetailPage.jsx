import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminModal from '../../../components/AdminModal';
import { ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import { deactivateAdminUser, getAdminUser, getAdminUserJobs, reactivateAdminUser } from '../../../services/adminUserService';
import './AdminUsers.scss';

const SECTIONS = ['overview', 'profile', 'kyc', 'jobs', 'wallet', 'ratings', 'history'];
const money = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDate = (value) => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState('overview');
  const [modal, setModal] = useState(false);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState({ items: [], pagination: null });
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const jobsRequested = useRef(false);

  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { const response = await getAdminUser(userId, signal); setDetail(response.DT); }
    catch (requestError) { if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load this user.'); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const loadJobs = useCallback(async (page = 1) => {
    setJobsLoading(true); setJobsError('');
    try { setJobs((await getAdminUserJobs(userId, { page, page_size: 20 })).DT); }
    catch (requestError) { setJobsError(requestError?.EM || 'Unable to load Jobs.'); }
    finally { setJobsLoading(false); }
  }, [userId]);
  useEffect(() => {
    if (section === 'jobs' && !jobsRequested.current) {
      jobsRequested.current = true;
      void loadJobs();
    }
  }, [section, loadJobs]);

  if (loading) return <LoadingState message="Loading user workspace..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (!detail) return null;
  const user = detail.overview;
  const action = detail.allowed_admin_actions[0];
  const requirements = detail.decision_requirements[action];
  const activate = action === 'REACTIVATE_USER';
  const submit = async () => {
    if (!reasonCode || (reasonCode === 'OTHER' && !reasonText.trim())) { toast.error('Select a reason and provide the required note.'); return; }
    setSubmitting(true);
    try {
      const mutate = activate ? reactivateAdminUser : deactivateAdminUser;
      await mutate(user.user_id, { reason_code: reasonCode, reason_text: reasonText.trim() || null });
      toast.success(`Account ${activate ? 'reactivated' : 'deactivated'}.`); setModal(false); setReasonCode(''); setReasonText(''); await load();
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to update account status.'); if (requestError?.code === 'ACCOUNT_STATUS_ALREADY_SET') { setModal(false); await load(); } }
    finally { setSubmitting(false); }
  };
  return <div className="admin-user-detail">
    <button type="button" className="back-link" onClick={() => navigate('/admin/users')}>← Back to users</button>
    <header className="user-workspace-header"><div className="identity"><span className="user-avatar large">{user.full_name?.slice(0, 1)}</span><div><div className="eyebrow">{user.role} · {user.user_id}</div><h2>{user.full_name}</h2><p>{user.email} · {user.phone_number || 'No phone number'}</p><div className="badge-line"><StatusBadge status={user.is_active ? 'ACTIVE' : 'INACTIVE'} /><StatusBadge status={user.kyc_status} /></div></div></div><button className={activate ? 'primary-action' : 'danger-action'} onClick={() => setModal(true)}>{activate ? 'Reactivate account' : 'Deactivate account'}</button></header>
    <nav className="user-section-nav" aria-label="User detail sections">{SECTIONS.map((item) => <button className={section === item ? 'active' : ''} key={item} onClick={() => setSection(item)}>{item.replace('-', ' ')}</button>)}</nav>
    <main className="user-section">
      {section === 'overview' && <><section className="summary-band"><div><span>Member since</span><strong>{formatDate(user.created_at)}</strong></div><div><span>Jobs</span><strong>{detail.job_summary.total}</strong></div><div><span>Active impact</span><strong>{detail.active_job_impact.active_job_count}</strong></div><div><span>Rating</span><strong>{detail.ratings.average} ★</strong></div></section><section><h3>Operational impact</h3><p className="section-copy">Deactivation blocks login, API and realtime access immediately. Existing Jobs and financial state are not changed automatically.</p><div className="impact-grid">{Object.entries(detail.active_job_impact.active_jobs_by_status).map(([status, count]) => <div key={status}><span>{status}</span><strong>{count}</strong></div>)}</div></section></>}
      {section === 'profile' && <section><h3>Business profile</h3><dl className="info-grid"><div><dt>Email verified</dt><dd>{user.email_verified ? 'Yes' : 'No'}</dd></div><div><dt>Role</dt><dd>{user.role}</dd></div>{detail.profile && <><div><dt>Level</dt><dd>{detail.profile.handyman_level}</dd></div><div><dt>Security bond</dt><dd>{detail.profile.security_bond_status}</dd></div><div><dt>Completed jobs</dt><dd>{detail.profile.total_jobs_completed}</dd></div><div className="wide"><dt>Bio</dt><dd>{detail.profile.bio || 'No biography provided.'}</dd></div></>}</dl><h4>Addresses</h4><div className="plain-list">{detail.addresses.length ? detail.addresses.map((address) => <div key={address.id}><strong>{address.full_address}</strong><small>{address.is_default ? 'Default address' : 'Saved address'}</small></div>) : <p>No saved addresses.</p>}</div>{detail.profile && <><h4>Services</h4><div className="chip-list">{detail.profile.services.map((service) => <span key={service.id}>{service.name}{!service.is_active && ' · Inactive'}</span>)}</div></>}</section>}
      {section === 'kyc' && <section><h3>KYC submissions</h3><p className="section-copy">Documents are loaded only after explicit access from canonical KYC Management.</p><div className="plain-list">{detail.kyc.history.length ? detail.kyc.history.map((submission) => <div key={submission.submission_id}><span><strong>Submission #{submission.submission_sequence}</strong><small>{submission.documents.length} documents · {formatDate(submission.submitted_at)}</small></span><span><StatusBadge status={submission.status} /><Link to={`/admin/kyc?submission=${submission.submission_id}`}>Open in KYC</Link></span></div>) : <p>No canonical KYC submissions.</p>}</div></section>}
      {section === 'jobs' && <section><h3>Jobs</h3>{jobsLoading ? <LoadingState message="Loading Jobs..." /> : jobsError ? <ErrorState message={jobsError} onRetry={() => loadJobs(jobs.pagination?.page || 1)} /> : <><div className="plain-list">{jobs.items.length ? jobs.items.map((job) => <Link className="linked-row" to={`/admin/jobs/${job.job_id}`} key={job.job_id}><span><strong>{job.service_name || 'Service request'}</strong><small>{job.issue_summary}</small></span><StatusBadge status={job.status} /></Link>) : <p>No Jobs found.</p>}</div>{jobs.pagination && <div className="user-jobs-pagination"><button disabled={jobs.pagination.page <= 1} onClick={() => loadJobs(jobs.pagination.page - 1)}>Previous</button><span>Page {jobs.pagination.page}/{jobs.pagination.total_pages || 1}</span><button disabled={jobs.pagination.page >= jobs.pagination.total_pages} onClick={() => loadJobs(jobs.pagination.page + 1)}>Next</button></div>}</>}</section>}
      {section === 'wallet' && <section><h3>Wallet summary</h3><div className="wallet-grid">{detail.wallets.map((wallet) => <article key={wallet.wallet_type}><span>{wallet.wallet_type}</span><strong>{money(wallet.available_balance, wallet.currency)}</strong><small>{wallet.status} · {wallet.transaction_count} ledger entries</small><small>In {money(wallet.total_incoming)} · Out {money(wallet.total_outgoing)}</small></article>)}</div><Link to={`/admin/transactions?user_id=${user.user_id}`}>View all related transactions</Link></section>}
      {section === 'ratings' && <section><h3>Ratings</h3><p className="rating-lead">{detail.ratings.average} ★ from {detail.ratings.count} reviews</p><div className="plain-list">{detail.ratings.recent.length ? detail.ratings.recent.map((rating) => <Link className="linked-row" to={`/admin/jobs/${rating.job_id}`} key={rating.review_id}><span><strong>{rating.rating_stars} ★</strong><small>{rating.comment || 'No written review.'}</small></span><small>{formatDate(rating.created_at)}</small></Link>) : <p>No canonical ratings.</p>}</div></section>}
      {section === 'history' && <section><h3>Account status history</h3><div className="account-timeline">{detail.account_status_history.length ? detail.account_status_history.map((entry) => <article key={`${entry.correlation_id}-${entry.occurred_at}`}><span className="timeline-dot" /><div><strong>{entry.action}</strong><p>{entry.reason_code}{entry.reason_text ? ` · ${entry.reason_text}` : ''}</p><small>{entry.administrator.full_name} · {formatDate(entry.occurred_at)}</small></div></article>) : <p>No account status actions.</p>}</div></section>}
    </main>
    <AdminModal open={modal} titleId="account-action-title" onClose={() => setModal(false)} submitting={submitting} className="account-action-modal"><div className="modal-heading"><h3 id="account-action-title">{activate ? 'Reactivate' : 'Deactivate'} {user.full_name}</h3><p>{activate ? 'Previous sessions remain revoked. The user must sign in again.' : 'Access will stop immediately. Jobs and financial state remain unchanged.'}</p></div>{!activate && detail.active_job_impact.active_job_count > 0 && <div className="impact-warning"><strong>{detail.active_job_impact.active_job_count} active Job(s)</strong><span>These Jobs will not be cancelled or settled automatically.</span></div>}<label>Reason<select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}><option value="">Select a reason</option>{requirements.reason_codes.map((code) => <option key={code}>{code}</option>)}</select></label><label>Admin note<textarea value={reasonText} maxLength={requirements.reason_text_max_length} onChange={(e) => setReasonText(e.target.value)} /><small>{reasonText.length}/{requirements.reason_text_max_length}</small></label><div className="modal-actions"><button onClick={() => setModal(false)} disabled={submitting}>Cancel</button><button className={activate ? 'primary-action' : 'danger-action'} onClick={submit} disabled={submitting}>{submitting ? 'Saving...' : `Confirm ${activate ? 'reactivation' : 'deactivation'}`}</button></div></AdminModal>
  </div>;
};

export default AdminUserDetailPage;
