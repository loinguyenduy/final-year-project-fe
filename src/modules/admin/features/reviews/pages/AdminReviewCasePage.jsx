import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaComments, FaFileImage, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import AdminModal from '../../../components/AdminModal';
import {
  decideAdminReviewCase,
  getAdminReviewCase,
  getAdminReviewChat,
  getAdminReviewEvidenceAccess
} from '../../../services/adminReviewService';
import AdminReviewDecisionModal from '../components/AdminReviewDecisionModal';
import './AdminReviewCasePage.scss';

const ACTION_LABELS = {
  APPROVE_REWORK: 'Approve rework', REJECT_CLAIM: 'Reject claim', ALLOW_ANOTHER_REWORK: 'Allow another rework',
  RELEASE_WARRANTY_RESERVE: 'Release reserve', REFUND_WARRANTY_RESERVE: 'Refund reserve',
  RESOLVE_CANCELLATION_CUSTOMER_FAULT: 'Customer fault', RESOLVE_CANCELLATION_HANDYMAN_FAULT: 'Handyman fault',
  RESOLVE_CANCELLATION_NEUTRAL: 'Neutral resolution'
};
const money = (value) => value == null ? '—' : `${Number(value).toLocaleString()} VND`;

const AdminReviewCasePage = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshQueueCounts } = useOutletContext();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('SUMMARY');
  const [decision, setDecision] = useState(null);
  const [decisionKey, setDecisionKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaLoadingId, setMediaLoadingId] = useState(null);
  const [chat, setChat] = useState({ messages: [], next_cursor: null, has_more: false, loaded: false });
  const [chatLoading, setChatLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    setError('');
    try { const response = await getAdminReviewCase(caseType, caseId); setDetail(response.DT); }
    catch (requestError) { setError(requestError?.EM || 'Unable to load the Review case.'); }
    finally { setLoading(false); }
  }, [caseId, caseType]);

  useEffect(() => { setLoading(true); void loadDetail(); }, [loadDetail]);
  useEffect(() => {
    const refresh = () => void loadDetail();
    window.addEventListener('admin:review-queue-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('admin:review-queue-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [loadDetail]);

  const loadChat = useCallback(async (append = false) => {
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const response = await getAdminReviewChat(caseType, caseId, { limit: 30, ...(append && chat.next_cursor ? { cursor: chat.next_cursor } : {}) });
      setChat((current) => ({ ...response.DT, messages: append ? [...response.DT.messages, ...current.messages] : response.DT.messages, loaded: true }));
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to load Chat transcript.'); }
    finally { setChatLoading(false); }
  }, [caseId, caseType, chat.next_cursor, chatLoading]);

  useEffect(() => { if (tab === 'CHAT' && !chat.loaded) void loadChat(); }, [chat.loaded, loadChat, tab]);

  const openEvidence = async (evidence) => {
    setMediaLoadingId(evidence.id);
    try {
      const response = await getAdminReviewEvidenceAccess(caseType, caseId, evidence.id);
      setMedia({ ...evidence, url: response.DT.url });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to open Evidence.'); }
    finally { setMediaLoadingId(null); }
  };

  const decisionImpact = useMemo(() => {
    if (!decision || !detail) return '';
    if (decision === 'RELEASE_WARRANTY_RESERVE') return `The full remaining reserve (${money(detail.warranty?.held_amount)}) will be released to the Handyman.`;
    if (decision === 'REFUND_WARRANTY_RESERVE') return `The full remaining reserve (${money(detail.warranty?.held_amount)}) will be refunded to the Customer.`;
    if (decision.startsWith('RESOLVE_CANCELLATION')) return `The held deposit (${money(detail.case?.deposit_amount)}) will be distributed by the canonical ${detail.case?.status_when_cancelled} policy. Platform receives 0%.`;
    if (decision === 'REJECT_CLAIM' && new Date(detail.warranty?.ends_at) <= new Date()) return 'The Claim will be rejected. Because the Warranty expired, the remaining reserve will be released to the Handyman by policy.';
    return 'This action updates the canonical case state and creates an immutable Admin Audit record.';
  }, [decision, detail]);

  const submitDecision = async (reason) => {
    if (submitting) return;
    setSubmitting(true); setDecisionError('');
    try {
      await decideAdminReviewCase(caseType, caseId, { decision, ...reason, idempotency_key: decisionKey });
      setDecision(null); setDecisionKey(null);
      await Promise.all([loadDetail(), refreshQueueCounts()]);
      toast.success('Decision completed successfully.');
    } catch (requestError) {
      const stale = ['SOURCE_STATE_CHANGED', 'REVIEW_CASE_NOT_ACTIONABLE', 'IDEMPOTENCY_CONFLICT'].includes(requestError?.code);
      if (stale) { setDecision(null); setDecisionKey(null); await Promise.all([loadDetail(), refreshQueueCounts()]); toast.warning('This case changed while you were reviewing it. Canonical data was refreshed.'); }
      else setDecisionError(requestError?.EM || 'Unable to complete the decision.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState message="Loading review case..." />;
  if (error || !detail) return <ErrorState message={error || 'Review case not found.'} onRetry={loadDetail} />;
  const settlementAction = ['RELEASE_WARRANTY_RESERVE', 'REFUND_WARRANTY_RESERVE'].includes(decision)
    || decision?.startsWith('RESOLVE_CANCELLATION')
    || (decision === 'REJECT_CLAIM' && new Date(detail.warranty?.ends_at) <= new Date());

  return (
    <div className="review-detail-page">
      <button className="review-back" type="button" onClick={() => navigate(`/admin/reviews${location.state?.reviewSearch ? `?${location.state.reviewSearch}` : ''}`)}><FaArrowLeft /> Back to Review Center</button>
      <header className="review-detail-header"><div><span>{detail.case_type.replaceAll('_', ' ')}</span><h2>Job {detail.job.id}</h2><p>{detail.job.service_name || detail.job.issue_description}</p></div><StatusBadge status={detail.review_status} /></header>
      {detail.participant_message_code && <div className="review-policy-note">The warranty claim was not approved. The warranty period has ended, so the remaining warranty reserve was released according to policy.</div>}
      <nav className="review-tabs" aria-label="Review detail sections">
        {[['SUMMARY', 'Summary'], ['EVIDENCE', 'Evidence'], ['CHAT', 'Chat'], ['HISTORY', 'History'], ['FINANCE', 'Finance']].map(([value, text]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value === 'EVIDENCE' && <FaFileImage />}{value === 'CHAT' && <FaComments />}{value === 'HISTORY' && <FaHistory />}{value === 'FINANCE' && <FaMoneyBillWave />}{text}</button>)}
      </nav>
      {tab === 'SUMMARY' && <section className="review-detail-grid"><article><h3>Case</h3><dl>{Object.entries(detail.case || {}).filter(([key]) => !['createdAt', 'updatedAt'].includes(key)).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value == null ? '—' : String(value)}</dd></div>)}</dl></article><article><h3>Participants & Job</h3><dl><div><dt>Customer</dt><dd>{detail.parties.customer?.full_name}<small>{detail.parties.customer?.email}</small></dd></div><div><dt>Handyman</dt><dd>{detail.parties.handyman?.full_name}<small>{detail.parties.handyman?.email}</small></dd></div><div><dt>Masked address</dt><dd>{detail.job.masked_address || '—'}</dd></div><div><dt>Job status</dt><dd>{detail.job.status}</dd></div></dl></article>{detail.location_review && <article><h3>Location-derived context</h3><dl>{Object.entries(detail.location_review).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value == null ? '—' : String(value)}</dd></div>)}</dl></article>}</section>}
      {tab === 'EVIDENCE' && <section className="review-evidence-grid">{detail.evidence.length ? detail.evidence.map((item) => <button key={item.id} onClick={() => openEvidence(item)} disabled={mediaLoadingId === item.id}><FaFileImage /><strong>{item.stage}</strong><span>{item.mime_type || 'Image'} · {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : 'Unknown time'}</span><small>{mediaLoadingId === item.id ? 'Requesting access...' : 'Open on demand'}</small></button>) : <p>No Evidence is attached to this case.</p>}</section>}
      {tab === 'CHAT' && <section className="review-chat"><p className="readonly-note">Read-only transcript. Viewing does not mark participant messages as read.</p>{chat.has_more && <button onClick={() => loadChat(true)} disabled={chatLoading}>{chatLoading ? 'Loading...' : 'Load earlier messages'}</button>}<div>{chat.messages.map((message) => <article key={message.id}><header><strong>{message.sender?.full_name || 'Participant'}</strong><time>{new Date(message.sent_at).toLocaleString()}</time></header><p>{message.content}</p></article>)}</div>{chat.loaded && !chat.messages.length && <p>No messages are available.</p>}</section>}
      {tab === 'HISTORY' && <section className="review-history"><h3>Job lifecycle</h3>{detail.job_history.map((entry) => <article key={entry.id}><strong>{entry.old_status || '—'} → {entry.new_status}</strong><span>{entry.reason}</span><time>{new Date(entry.createdAt).toLocaleString()}</time></article>)}<h3>Admin decisions</h3>{detail.admin_decisions.map((entry) => <article key={entry.id}><strong>{entry.action}</strong><span>{entry.reason_code}{entry.reason_text ? ` — ${entry.reason_text}` : ''}</span><time>{new Date(entry.createdAt).toLocaleString()}</time></article>)}</section>}
      {tab === 'FINANCE' && <section className="review-finance"><div><span>Warranty held</span><strong>{money(detail.warranty?.held_amount)}</strong></div><div><span>Released</span><strong>{money(detail.warranty?.released_amount)}</strong></div><div><span>Refunded</span><strong>{money(detail.warranty?.refunded_amount)}</strong></div>{detail.financial_ledger.map((entry) => <article key={entry.id}><strong>{entry.transaction_type}</strong><span>{money(entry.amount)}</span><small>{entry.status} · {new Date(entry.createdAt).toLocaleString()}</small></article>)}</section>}
      {detail.allowed_actions.length > 0 && <footer className="review-action-bar">{detail.allowed_actions.map((action) => <button key={action} className={action.includes('REFUND') || action.includes('HANDYMAN_FAULT') ? 'danger' : ''} onClick={() => { setDecision(action); setDecisionKey(crypto.randomUUID()); }}>{ACTION_LABELS[action]}</button>)}</footer>}
      <AdminReviewDecisionModal open={Boolean(decision)} action={decision} requiresText={settlementAction} impact={decisionImpact} submitting={submitting} error={decisionError} onClose={() => { if (!submitting) { setDecision(null); setDecisionKey(null); } }} onSubmit={submitDecision} />
      <AdminModal open={Boolean(media)} titleId="review-evidence-title" onClose={() => setMedia(null)} className="review-lightbox-dialog">
        {media && <><h2 id="review-evidence-title" className="sr-only">Evidence preview</h2><button aria-label="Close Evidence preview" onClick={() => setMedia(null)}>×</button><img src={media.url} alt={`${media.stage} Evidence`} /></>}
      </AdminModal>
    </div>
  );
};

export default AdminReviewCasePage;
