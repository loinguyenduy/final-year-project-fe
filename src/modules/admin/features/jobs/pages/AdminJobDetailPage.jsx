import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaBriefcase,
  FaComments,
  FaFileContract,
  FaFileImage,
  FaHistory,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaShieldAlt,
  FaStar,
  FaUsers
} from 'react-icons/fa';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import AdminModal from '../../../components/AdminModal';
import LocationPickerMap from '../../../../matchmaking/components/LocationPickerMap';
import {
  getAdminJob,
  getAdminJobChat,
  getAdminJobCycle,
  getAdminJobEvidenceAccess,
  getAdminJobImageAccess,
  listAdminJobAudits,
  listAdminJobBids,
  listAdminJobEvidence,
  listAdminJobTimeline,
  listAdminJobTransactions
} from '../../../services/adminJobService';
import { decideAdminReviewCase } from '../../../services/adminReviewService';
import AdminJobDecisionModal from '../components/AdminJobDecisionModal';
import './AdminJobs.scss';

const SECTIONS = [
  ['overview', 'Overview', FaBriefcase],
  ['location', 'Location', FaMapMarkedAlt],
  ['participants', 'Participants', FaUsers],
  ['lifecycle', 'Lifecycle', FaHistory],
  ['quote-contract', 'Quote & Contract', FaFileContract],
  ['evidence', 'Evidence', FaFileImage],
  ['chat', 'Chat', FaComments],
  ['finance', 'Finance', FaMoneyBillWave],
  ['reviews', 'Admin Review', FaShieldAlt],
  ['audit', 'Audit', FaHistory]
];
const SECTION_KEYS = new Set(SECTIONS.map(([key]) => key));
const ACTION_LABELS = {
  APPROVE_REWORK: 'Approve rework',
  REJECT_CLAIM: 'Reject claim',
  ALLOW_ANOTHER_REWORK: 'Allow another rework',
  RELEASE_WARRANTY_RESERVE: 'Release full reserve',
  REFUND_WARRANTY_RESERVE: 'Refund full reserve',
  RESOLVE_CANCELLATION_CUSTOMER_FAULT: 'Resolve as Customer fault',
  RESOLVE_CANCELLATION_HANDYMAN_FAULT: 'Resolve as Handyman fault',
  RESOLVE_CANCELLATION_NEUTRAL: 'Resolve as neutral'
};

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
const money = (value, currency = 'VND') => value == null ? '—' : `${Number(value).toLocaleString('en-US')} ${currency}`;
const words = (value) => value ? String(value).replaceAll('_', ' ') : '—';

const DefinitionGrid = ({ items, className = '' }) => (
  <dl className={`job-definition-grid ${className}`.trim()}>
    {items.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value ?? '—'}</dd></div>)}
  </dl>
);

const PersonPanel = ({ title, person }) => (
  <article className="participant-panel">
    <header><div className="participant-avatar">{person?.full_name?.[0] || '?'}</div><div><p>{title}</p><h3>{person?.full_name || `No ${title}`}</h3></div>{person && <StatusBadge status={person.is_active ? 'ACTIVE' : 'INACTIVE'} />}</header>
    {!person ? <p className="muted-copy">No participant is assigned.</p> : <>
      <DefinitionGrid items={[
        ['Email', person.email], ['Phone', person.phone_number], ['Role', person.role],
        ['KYC', words(person.kyc_status)], ['Email verified', person.is_email_verified ? 'Yes' : 'No']
      ]} />
      {person.profile && <div className="participant-profile-strip">
        <span><strong>{person.profile.handyman_level}</strong>Level</span>
        <span><strong>{person.profile.rating_summary?.average_rating || 'No reviews'} {person.profile.rating_summary?.average_rating && <FaStar color="#facc15" aria-label="star" />}</strong>Average rating</span>
        <span><strong>{person.profile.total_jobs_completed}</strong>Completed</span>
        <span><strong>{person.profile.accepted_cancellation_count}</strong>Cancellations</span>
      </div>}
      <div className="participant-subsection"><h4>Saved addresses</h4>{person.addresses?.length ? person.addresses.map((address) => <div className="address-line" key={address.id}><div><strong>{address.full_address}</strong><span>{address.ward_name || address.ward_code}, {address.province_name || address.province_code}</span></div>{address.is_default && <em>Default</em>}</div>) : <p className="muted-copy">No saved addresses.</p>}</div>
      <div className="participant-subsection"><h4>Wallet summary</h4>{person.wallets?.length ? <div className="wallet-summary-grid">{person.wallets.map((wallet) => <div key={wallet.wallet_type}><span>{words(wallet.wallet_type)}</span><strong>{money(wallet.available_balance, wallet.currency)}</strong><small className={wallet.status === 'BLOCKED' ? 'danger-text' : ''}>{wallet.status}</small></div>)}</div> : <p className="muted-copy">No participant Wallet.</p>}</div>
    </>}
  </article>
);

const AdminJobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { refreshQueueCounts } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionValue = searchParams.get('section') || 'overview';
  const section = SECTION_KEYS.has(sectionValue) ? sectionValue : 'overview';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cycleOverride, setCycleOverride] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [bids, setBids] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [audits, setAudits] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [chat, setChat] = useState({ loaded: false, loading: false, messages: [], has_more: false, next_cursor: null, conversation: null });
  const [transactions, setTransactions] = useState({ loaded: false, loading: false, items: [], has_more: false, next_cursor: null });
  const [media, setMedia] = useState(null);
  const [mediaLoading, setMediaLoading] = useState('');
  const [decision, setDecision] = useState(null);
  const [decisionKey, setDecisionKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const abortRef = useRef(null);
  const realtimeTimer = useRef(null);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await getAdminJob(jobId, controller.signal);
      setDetail(response.DT);
    } catch (requestError) {
      if (requestError?.name !== 'CanceledError' && requestError?.code !== 'ERR_CANCELED') {
        setError(requestError?.EM || 'Unable to load this Job.');
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setDetail(null);
    setCycleOverride(null);
    setBids(null);
    setTimeline(null);
    setAudits(null);
    setEvidence(null);
    setChat({ loaded: false, loading: false, messages: [], has_more: false, next_cursor: null, conversation: null });
    setTransactions({ loaded: false, loading: false, items: [], has_more: false, next_cursor: null });
    void loadDetail();
    return () => abortRef.current?.abort();
  }, [loadDetail]);

  useEffect(() => {
    const scheduleRefresh = (event) => {
      const updatedJobId = event?.detail?.resource?.job_id;
      if (updatedJobId && updatedJobId !== jobId) return;
      window.clearTimeout(realtimeTimer.current);
      realtimeTimer.current = window.setTimeout(() => void loadDetail({ silent: true }), 250);
    };
    window.addEventListener('admin:job-updated', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);
    return () => {
      window.clearTimeout(realtimeTimer.current);
      window.removeEventListener('admin:job-updated', scheduleRefresh);
      window.removeEventListener('focus', scheduleRefresh);
    };
  }, [jobId, loadDetail]);

  const selectedCycleNumber = Number(searchParams.get('cycle') || detail?.job?.acceptance_cycle || 0);
  const embeddedCycle = detail?.acceptance_cycles?.items?.find((entry) => Number(entry.acceptance_cycle) === selectedCycleNumber);
  const selectedCycle = cycleOverride?.acceptance_cycle === selectedCycleNumber ? cycleOverride : embeddedCycle;
  const reviewCaseCollection = selectedCycle?.review_cases || detail?.review_cases || [];
  const focusedCaseType = String(searchParams.get('case_type') || '').toUpperCase();
  const focusedCaseId = searchParams.get('case_id') || '';

  useEffect(() => {
    if (!detail || !selectedCycleNumber || embeddedCycle || cycleOverride?.acceptance_cycle === selectedCycleNumber) return;
    let active = true;
    setCycleLoading(true);
    getAdminJobCycle(jobId, selectedCycleNumber).then((response) => {
      if (active) setCycleOverride(response.DT);
    }).catch((requestError) => {
      if (active) toast.error(requestError?.EM || 'Unable to load the selected acceptance cycle.');
    }).finally(() => { if (active) setCycleLoading(false); });
    return () => { active = false; };
  }, [cycleOverride, detail, embeddedCycle, jobId, selectedCycleNumber]);

  useEffect(() => {
    setChat({ loaded: false, loading: false, messages: [], has_more: false, next_cursor: null, conversation: null });
    setTransactions({ loaded: false, loading: false, items: [], has_more: false, next_cursor: null });
    setEvidence(null);
  }, [selectedCycleNumber]);

  useEffect(() => {
    if (section !== 'reviews' || !focusedCaseId || !reviewCaseCollection.length) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`admin-job-review-${focusedCaseId}`)?.scrollIntoView({ block: 'center' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusedCaseId, focusedCaseType, reviewCaseCollection.length, section, selectedCycleNumber]);

  const selectSection = (nextSection) => {
    const next = new URLSearchParams(searchParams);
    nextSection === 'overview' ? next.delete('section') : next.set('section', nextSection);
    setSearchParams(next);
  };

  const selectCycle = (cycle) => {
    setCycleOverride(null);
    const next = new URLSearchParams(searchParams);
    next.set('cycle', String(cycle));
    setSearchParams(next);
  };

  const loadChat = useCallback(async (append = false) => {
    if (!selectedCycleNumber || chat.loading) return;
    setChat((current) => ({ ...current, loading: true }));
    try {
      const response = await getAdminJobChat(jobId, {
        acceptance_cycle: selectedCycleNumber,
        limit: 30,
        ...(append && chat.next_cursor ? { cursor: chat.next_cursor } : {})
      });
      setChat((current) => ({
        ...response.DT,
        messages: append ? [...response.DT.messages, ...current.messages] : response.DT.messages,
        loaded: true,
        loading: false
      }));
    } catch (requestError) {
      setChat((current) => ({ ...current, loading: false }));
      toast.error(requestError?.EM || 'Unable to load the read-only Chat transcript.');
    }
  }, [chat.loading, chat.next_cursor, jobId, selectedCycleNumber]);

  const loadTransactions = useCallback(async (append = false) => {
    if (!selectedCycleNumber || transactions.loading) return;
    setTransactions((current) => ({ ...current, loading: true }));
    try {
      const response = await listAdminJobTransactions(jobId, {
        acceptance_cycle: selectedCycleNumber,
        limit: 50,
        ...(append && transactions.next_cursor ? { cursor: transactions.next_cursor } : {})
      });
      setTransactions((current) => ({
        ...response.DT,
        items: append ? [...current.items, ...response.DT.items] : response.DT.items,
        loaded: true,
        loading: false
      }));
    } catch (requestError) {
      setTransactions((current) => ({ ...current, loading: false }));
      toast.error(requestError?.EM || 'Unable to load Transactions.');
    }
  }, [jobId, selectedCycleNumber, transactions.loading, transactions.next_cursor]);

  useEffect(() => {
    if (section === 'chat' && !chat.loaded && !chat.loading) void loadChat();
    if (section === 'finance' && !transactions.loaded && !transactions.loading) void loadTransactions();
  }, [chat.loaded, chat.loading, loadChat, loadTransactions, section, transactions.loaded, transactions.loading]);

  const loadMoreBids = async () => {
    const current = bids || detail.bids;
    const nextPage = Math.floor(current.items.length / 100) + 1;
    try {
      const response = await listAdminJobBids(jobId, { page: nextPage, page_size: 100 });
      setBids({
        items: [...current.items, ...response.DT.items],
        total_count: response.DT.pagination.total_items,
        has_more: nextPage < response.DT.pagination.total_pages
      });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to load more Bids.'); }
  };

  const loadMoreEvidence = async () => {
    const current = evidence || selectedCycle?.evidence || { items: [] };
    try {
      const response = await listAdminJobEvidence(jobId, {
        acceptance_cycle: selectedCycleNumber,
        limit: 100,
        ...(current.next_cursor ? { cursor: current.next_cursor } : {})
      });
      setEvidence({ ...response.DT, items: current.next_cursor ? [...current.items, ...response.DT.items] : response.DT.items });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to load Evidence metadata.'); }
  };

  const loadMoreTimeline = async () => {
    const current = timeline || detail.timeline;
    try {
      const response = await listAdminJobTimeline(jobId, {
        limit: 100,
        ...(current.next_cursor ? { cursor: current.next_cursor } : {})
      });
      setTimeline({ ...response.DT, items: [...response.DT.items, ...current.items] });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to load earlier timeline events.'); }
  };

  const loadMoreAudits = async () => {
    const current = audits || detail.admin_decisions;
    try {
      const response = await listAdminJobAudits(jobId, {
        limit: 100,
        ...(current.next_cursor ? { cursor: current.next_cursor } : {})
      });
      setAudits({ ...response.DT, items: [...current.items, ...response.DT.items] });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to load earlier Audit records.'); }
  };

  const openMedia = async (item, type = 'evidence') => {
    const key = type === 'evidence' ? item.id : item.key;
    setMediaLoading(key);
    try {
      const response = type === 'evidence'
        ? await getAdminJobEvidenceAccess(jobId, item.id)
        : await getAdminJobImageAccess(jobId, item.key);
      setMedia({ ...item, url: response.DT.url, type });
    } catch (requestError) { toast.error(requestError?.EM || 'Unable to open this media item.'); }
    finally { setMediaLoading(''); }
  };

  const selectedReviewCase = decision?.caseItem;
  const decisionAction = decision?.action;
  const decisionRequirements = selectedReviewCase?.decision_requirements?.[decisionAction];
  const decisionImpact = useMemo(() => {
    if (!decisionAction || !selectedReviewCase) return '';
    const warranty = selectedCycle?.warranties?.at(-1);
    if (decisionAction === 'RELEASE_WARRANTY_RESERVE') return `The full remaining Warranty Reserve will be released to the Handyman. Current held snapshot: ${money(warranty?.held_amount)}.`;
    if (decisionAction === 'REFUND_WARRANTY_RESERVE') return `The full remaining Warranty Reserve will be refunded to the Customer. Current held snapshot: ${money(warranty?.held_amount)}.`;
    if (decisionAction.startsWith('RESOLVE_CANCELLATION')) return 'The canonical cancellation policy will settle the full held amount. Platform receives 0%.';
    if (decisionAction === 'REJECT_CLAIM' && warranty?.ends_at && new Date(warranty.ends_at) <= new Date()) return 'The Claim will be rejected. Because the Warranty has expired, policy will release the remaining reserve to the Handyman.';
    return 'This action changes the canonical Review case and creates an immutable Admin Audit record.';
  }, [decisionAction, selectedReviewCase, selectedCycle]);

  const submitDecision = async (reason) => {
    if (!decisionAction || !selectedReviewCase || submitting) return;
    setSubmitting(true);
    setDecisionError('');
    try {
      await decideAdminReviewCase(selectedReviewCase.case_type, selectedReviewCase.case_id, {
        decision: decisionAction,
        ...reason,
        idempotency_key: decisionKey
      });
      setDecision(null);
      setDecisionKey(null);
      setCycleOverride(null);
      await Promise.all([loadDetail({ silent: true }), refreshQueueCounts()]);
      toast.success('Administrator decision completed successfully.');
    } catch (requestError) {
      const stale = ['SOURCE_STATE_CHANGED', 'REVIEW_CASE_NOT_ACTIONABLE', 'IDEMPOTENCY_CONFLICT', 'ADMIN_DECISION_REPLAYED'].includes(requestError?.code);
      if (stale) {
        setDecision(null);
        setDecisionKey(null);
        await Promise.all([loadDetail({ silent: true }), refreshQueueCounts()]);
        toast.warning('This case changed while it was open. Canonical data has been refreshed.');
      } else setDecisionError(requestError?.EM || 'Unable to complete this decision.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState message="Loading Job workspace..." />;
  if (error || !detail) return <ErrorState message={error || 'Job not found.'} onRetry={() => loadDetail()} />;

  const job = detail.job;
  const bidCollection = bids || detail.bids;
  const timelineCollection = timeline || detail.timeline;
  const auditCollection = audits || detail.admin_decisions;
  const evidenceCollection = evidence || selectedCycle?.evidence || { items: [], has_more: false };

  return (
    <div className="admin-job-detail-page">
      <button type="button" className="job-back-link" onClick={() => navigate('/admin/jobs')}><FaArrowLeft /> Back to Jobs</button>
      <header className="job-workspace-header">
        <div className="job-workspace-title"><p className="admin-eyebrow">Job workspace</p><h2>{job.display_title}</h2><div><span className="job-workspace-id">{job.id}</span><span>Cycle {job.acceptance_cycle || '—'}</span><span>Created {formatDate(job.created_at)}</span></div></div>
        <div className="job-workspace-state"><StatusBadge status={job.status} /><strong>{money(job.budget.final_agreed_price)}</strong><small>Final agreed price</small></div>
      </header>

      <div className="job-workspace-layout">
        <aside className="job-section-navigation" aria-label="Job detail sections">
          {SECTIONS.map(([key, label, Icon]) => <button key={key} type="button" className={section === key ? 'active' : ''} onClick={() => selectSection(key)}><Icon /><span>{label}</span>{key === 'reviews' && detail.section_counts.pending_review_cases > 0 && <em>{detail.section_counts.pending_review_cases}</em>}</button>)}
        </aside>

        <main className="job-workspace-content">
          {section !== 'overview' && detail.acceptance_cycles.index.length > 0 && <div className="cycle-toolbar"><label>Acceptance cycle<select value={selectedCycleNumber || ''} onChange={(event) => selectCycle(event.target.value)}>{!detail.acceptance_cycles.index.some((entry) => Number(entry.acceptance_cycle) === selectedCycleNumber) && selectedCycleNumber > 0 && <option value={selectedCycleNumber}>Cycle {selectedCycleNumber} — selected</option>}{detail.acceptance_cycles.index.map((entry) => <option key={entry.acceptance_cycle} value={entry.acceptance_cycle}>Cycle {entry.acceptance_cycle}{entry.is_current ? ' — current' : ''}</option>)}</select></label>{cycleLoading && <span>Loading cycle…</span>}</div>}

          {section === 'overview' && <div className="workspace-section">
            <div className="section-heading"><div><p className="admin-eyebrow">At a glance</p><h3>Operational overview</h3></div></div>
            <div className="overview-metric-strip"><div><span>Status</span><strong>{words(job.status)}</strong></div><div><span>Bids</span><strong>{detail.section_counts.bids}</strong></div><div><span>Evidence</span><strong>{detail.section_counts.evidence}</strong></div><div><span>Admin reviews</span><strong>{detail.section_counts.pending_review_cases} pending</strong></div></div>
            <div className="overview-split">
              <article className="workspace-panel"><h4>Service request</h4><p className="job-description">{job.issue_description}</p><DefinitionGrid items={[
                ['Service', job.service?.name], ['Scheduled', formatDate(job.scheduled_at)],
                ['Budget range', `${money(job.budget.min)} – ${money(job.budget.max)}`],
                ['Deposit', `${money(job.deposit.amount)} · ${words(job.deposit.status)}`]
              ]} /></article>
              <article className="workspace-panel review-alert-panel"><h4>Administrative attention</h4>{detail.section_counts.pending_review_cases ? <><strong>{detail.section_counts.pending_review_cases} case(s) require a decision</strong><p>Open Admin Review to inspect the source state and apply a canonical action.</p><button onClick={() => selectSection('reviews')}>Open Admin Review</button></> : <><strong>No pending Admin decision</strong><p>This Job has no actionable Warranty or Cancellation review case.</p></>}</article>
            </div>
          </div>}

          {section === 'location' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Authorized operational location</p><h3>Location and arrival snapshots</h3><p>Raw coordinates are restricted to this section and are never copied into Timeline, Audit or logs.</p></div><FaMapMarkedAlt /></div><article className="workspace-panel location-workspace"><div className="section-heading"><div><h4>Service location</h4><p>{detail.location.address.service_address || 'No service address is recorded.'}</p></div><StatusBadge status={detail.location.job_pin.confirmed ? 'CONFIRMED' : 'PENDING'} /></div><div className="location-layout"><div><strong>{detail.location.address.detail_address || detail.location.address.service_address || 'No detailed address'}</strong><p>{detail.location.address.ward_name || detail.location.address.ward_code}, {detail.location.address.province_name || detail.location.address.province_code}</p><DefinitionGrid items={[
            ['Source', words(detail.location.job_pin.source)], ['Confirmed at', formatDate(detail.location.job_pin.confirmed_at)],
            ['Job latitude', detail.location.job_pin.gps_lat], ['Job longitude', detail.location.job_pin.gps_long],
            ['En-route latitude', detail.location.en_route.gps_lat], ['En-route longitude', detail.location.en_route.gps_long],
            ['GPS accuracy', detail.location.en_route.accuracy_meters == null ? '—' : `${detail.location.en_route.accuracy_meters} m`],
            ['En-route distance', detail.location.en_route.distance_meters == null ? '—' : `${detail.location.en_route.distance_meters} m`],
            ['Arrival estimate', detail.location.en_route.estimated_arrival_minutes == null ? '—' : `${detail.location.en_route.estimated_arrival_minutes} min`],
            ['Movement started', formatDate(detail.location.en_route.started_at)]
          ]} /></div><LocationPickerMap latitude={detail.location.job_pin.gps_lat} longitude={detail.location.job_pin.gps_long} readOnly /></div></article><article className="workspace-panel"><div className="section-heading"><div><h4>Arrival request snapshots</h4><p>Coordinates below are immutable request-time operational context.</p></div><span>{detail.location.arrivals.length} snapshots</span></div>{detail.location.arrivals.length ? <div className="arrival-snapshot-list">{detail.location.arrivals.map((arrival) => <article key={arrival.id}><header><strong>{words(arrival.status)}</strong><time>{formatDate(arrival.requested_at)}</time></header><DefinitionGrid items={[
            ['Latitude', arrival.request_gps_lat], ['Longitude', arrival.request_gps_long],
            ['Accuracy', arrival.request_gps_accuracy_meters == null ? '—' : `${arrival.request_gps_accuracy_meters} m`],
            ['Distance to Job', arrival.distance_to_job_meters == null ? '—' : `${arrival.distance_to_job_meters} m`],
            ['Location warning', words(arrival.location_warning)], ['Resolved', formatDate(arrival.responded_at)]
          ]} /></article>)}</div> : <p className="muted-copy">No arrival request snapshot exists for this Job.</p>}</article></div>}

          {section === 'participants' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Identity and access context</p><h3>Participants</h3><p>Saved addresses exclude stored GPS. Financial details are limited to current Wallet summaries.</p></div></div><div className="participant-grid"><PersonPanel title="Customer" person={detail.participants.customer} /><PersonPanel title="Handyman" person={detail.participants.handyman} /></div></div>}

          {section === 'lifecycle' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Event history</p><h3>Lifecycle timeline</h3><p>Legacy cycle assignments are explicitly marked as inferred.</p></div></div>{timelineCollection.has_more && <button className="load-more-inline" onClick={loadMoreTimeline}>Load earlier events</button>}<div className="admin-job-timeline">{timelineCollection.items.map((event) => <article key={event.event_id}><div className="timeline-marker" /><div><header><strong>{event.title}</strong><time>{formatDate(event.occurred_at)}</time></header><p>{words(event.status)}</p><footer><span>{event.acceptance_cycle ? `Cycle ${event.acceptance_cycle}` : 'Job-level'}</span><em className={event.cycle_assignment === 'CANONICAL' ? 'canonical' : ''}>{words(event.cycle_assignment)}</em>{event.actor && <span>{event.actor.full_name}</span>}</footer></div></article>)}</div></div>}

          {section === 'quote-contract' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Commercial agreement</p><h3>Quote and Contract</h3></div></div>{!selectedCycle ? <p className="muted-copy">No lifecycle resources for this cycle.</p> : <div className="commercial-stack">{selectedCycle.quotes.map((quote) => <article className="workspace-panel" key={quote.id}><header className="resource-heading"><div><span>Quote version {quote.version}</span><h4>{quote.problem_summary || 'Inspection quote'}</h4></div><StatusBadge status={quote.status} /></header><DefinitionGrid items={[
            ['Total', money(quote.total_amount, quote.currency)], ['Discount', money(quote.discount_amount, quote.currency)],
            ['Duration', quote.estimated_duration_minutes ? `${quote.estimated_duration_minutes} minutes` : '—'], ['Warranty', quote.warranty_days == null ? '—' : `${quote.warranty_days} days`],
            ['Submitted', formatDate(quote.submitted_at)], ['Accepted', formatDate(quote.accepted_at)]
          ]} /><p>{quote.recommended_solution}</p>{quote.items.length > 0 && <div className="quote-items"><div className="quote-item header"><span>Item</span><span>Qty</span><span>Unit price</span><span>Total</span></div>{quote.items.map((item) => <div className="quote-item" key={item.id}><span><strong>{item.name}</strong><small>{item.description}</small></span><span>{item.quantity} {item.unit}</span><span>{money(item.unit_price, quote.currency)}</span><span>{money(item.line_total, quote.currency)}</span></div>)}</div>}</article>)}{selectedCycle.contracts.map((contract) => <article className="workspace-panel contract-panel" key={contract.id}><header className="resource-heading"><div><span>Contract {contract.contract_number}</span><h4>{contract.problem_summary}</h4></div><StatusBadge status={contract.status} /></header><DefinitionGrid items={[
            ['Effective', formatDate(contract.effective_at)], ['Total escrow', money(contract.full_escrow_amount, contract.currency)],
            ['Deposit', money(contract.deposit_amount, contract.currency)], ['Remaining payment', money(contract.remaining_payment_amount, contract.currency)],
            ['Warranty', `${contract.warranty_days} days`], ['PDF snapshot', contract.pdf_available ? 'Available in source record' : 'Not available']
          ]} /><p>{contract.recommended_solution}</p></article>)}</div>}</div>}

          {section === 'evidence' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">On-demand media</p><h3>Evidence gallery</h3><p>URLs are requested only when an item is opened and are never persisted.</p></div></div>{job.images.items.length > 0 && <article className="workspace-panel"><h4>Original Job images</h4><div className="evidence-gallery compact">{job.images.items.map((item) => <button key={item.key} onClick={() => openMedia(item, 'job-image')} disabled={mediaLoading === item.key}><FaFileImage /><strong>Job image {item.position}</strong><span>{mediaLoading === item.key ? 'Requesting access…' : 'Open on demand'}</span></button>)}</div></article>}{!evidenceCollection.items.length ? <p className="muted-copy">No Evidence is available for this cycle.</p> : <div className="evidence-gallery">{evidenceCollection.items.map((item) => <button key={item.id} onClick={() => openMedia(item)} disabled={mediaLoading === item.id}><FaFileImage /><strong>{words(item.stage)}</strong><span>{item.mime_type || 'Image'} · {item.file_size ? `${Math.ceil(item.file_size / 1024)} KB` : 'Unknown size'}</span><small>{item.uploader?.full_name || 'Unknown uploader'} · {formatDate(item.uploaded_at)}</small><em>{mediaLoading === item.id ? 'Requesting access…' : 'Open image'}</em></button>)}</div>}{evidenceCollection.has_more && <button className="load-more-inline" onClick={loadMoreEvidence}>Load more Evidence</button>}</div>}

          {section === 'chat' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Read-only communication</p><h3>Conversation transcript</h3><p>Viewing this transcript does not join the room or mark participant messages as read.</p></div>{chat.conversation && <StatusBadge status={chat.conversation.status} />}</div>{chat.loading && !chat.loaded ? <LoadingState message="Loading Chat transcript..." /> : !chat.messages.length ? <p className="muted-copy">No messages are available for this cycle.</p> : <><div className="readonly-conversation">{chat.messages.map((message) => <article key={message.id}><div className="message-avatar">{message.sender?.full_name?.[0] || '?'}</div><div><header><strong>{message.sender?.full_name || 'Participant'}</strong><span>{message.sender?.role}</span><time>{formatDate(message.sent_at)}</time></header><p>{message.content}</p></div></article>)}</div>{chat.has_more && <button className="load-more-inline" disabled={chat.loading} onClick={() => loadChat(true)}>{chat.loading ? 'Loading…' : 'Load earlier messages'}</button>}</>}</div>}

          {section === 'finance' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Read-only financial context</p><h3>Finance and Transactions</h3><p>Diagnostics compare canonical snapshots and ledger entries without repairing data.</p></div></div>{selectedCycle?.finance && <article className={`finance-diagnostic ${selectedCycle.finance.status.toLowerCase()}`}><div><span>Consistency diagnostic</span><strong>{words(selectedCycle.finance.status)}</strong></div><DefinitionGrid items={[
            ['Expected reserve', money(selectedCycle.finance.expected_reserve)], ['Released', money(selectedCycle.finance.released_total)],
            ['Refunded', money(selectedCycle.finance.refunded_total)], ['Remaining', money(selectedCycle.finance.remaining_reserve)]
          ]} />{selectedCycle.finance.reasons?.length > 0 && <p>{selectedCycle.finance.reasons.map(words).join(', ')}</p>}</article>}{transactions.loading && !transactions.loaded ? <LoadingState message="Loading Transactions..." /> : <div className="transaction-list">{transactions.items.map((entry) => <article key={entry.id}><div><strong>{words(entry.transaction_type)}</strong><span>{entry.description}</span></div><div><strong>{money(entry.amount, entry.currency)}</strong><span>{entry.from?.type || 'External'} → {entry.to?.type || 'External'}</span></div><div><StatusBadge status={entry.status} /><time>{formatDate(entry.created_at)}</time></div></article>)}</div>}{transactions.loaded && !transactions.items.length && <p className="muted-copy">No Transactions are recorded for this cycle.</p>}{transactions.has_more && <button className="load-more-inline" disabled={transactions.loading} onClick={() => loadTransactions(true)}>{transactions.loading ? 'Loading…' : 'Load more Transactions'}</button>}</div>}

          {section === 'reviews' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Canonical decisions</p><h3>Admin Review cases</h3><p>Only actions permitted by the current backend source state are displayed for the selected cycle.</p></div></div>{!reviewCaseCollection.length ? <p className="muted-copy">This acceptance cycle has no Admin Review case.</p> : <div className="job-review-cases">{reviewCaseCollection.map((caseItem) => { const targeted = caseItem.case_id === focusedCaseId && (!focusedCaseType || caseItem.case_type === focusedCaseType); return <article id={`admin-job-review-${caseItem.case_id}`} key={`${caseItem.case_type}:${caseItem.case_id}`} className={`${caseItem.allowed_actions.length ? 'actionable' : ''}${targeted ? ' targeted' : ''}`.trim()} aria-current={targeted ? 'true' : undefined}><header><div><span>{words(caseItem.case_type)} · Cycle {caseItem.acceptance_cycle || '—'}</span><h4>{words(caseItem.state)}</h4><code>{caseItem.case_id}</code></div><StatusBadge status={caseItem.allowed_actions.length ? 'ACTION_REQUIRED' : 'HISTORY'} /></header><DefinitionGrid items={[
            ['Reason', words(caseItem.summary.reason || caseItem.summary.reason_code || caseItem.summary.rejection_reason)],
            ['Submitted/requested', formatDate(caseItem.summary.submitted_at || caseItem.summary.requested_at)],
            ['Resolved/responded', formatDate(caseItem.summary.resolved_at || caseItem.summary.responded_at)]
          ]} />{caseItem.allowed_actions.length > 0 && <footer>{caseItem.allowed_actions.map((action) => <button key={action} className={action.includes('REFUND') || action.includes('HANDYMAN_FAULT') ? 'danger' : ''} onClick={() => { setDecision({ caseItem, action }); setDecisionKey(crypto.randomUUID()); setDecisionError(''); }}>{ACTION_LABELS[action] || words(action)}</button>)}</footer>}</article>; })}</div>}</div>}

          {section === 'audit' && <div className="workspace-section"><div className="section-heading"><div><p className="admin-eyebrow">Immutable business history</p><h3>Admin decisions and Reviews</h3><p>Only Audit records related to canonical cases from this Job are shown.</p></div></div>{auditCollection.has_more && <button className="load-more-inline" onClick={loadMoreAudits}>Load earlier Audit records</button>}<div className="audit-list">{auditCollection.items.map((entry) => <article key={entry.id}><div><strong>{words(entry.action)}</strong><span>{words(entry.target_type)} · {entry.target_id}</span></div><div><span>{words(entry.reason_code)}</span>{entry.reason_text && <p>{entry.reason_text}</p>}</div><footer><span>{entry.administrator?.full_name || 'Administrator'}</span><time>{formatDate(entry.created_at)}</time></footer></article>)}</div>{!auditCollection.items.length && <p className="muted-copy">No related Admin Audit records.</p>}</div>}

          {section === 'overview' && bidCollection.items.length > 0 && <article className="workspace-panel bids-overview"><div className="section-heading"><div><p className="admin-eyebrow">Marketplace response</p><h4>All Bids</h4></div><span>{bidCollection.total_count} total</span></div><div className="bid-list">{bidCollection.items.map((bid) => <div key={bid.id} className={bid.is_selected ? 'selected' : ''}><div><strong>{bid.handyman?.full_name || 'Unknown Handyman'}</strong><span>{bid.message || 'No message'}</span></div><div><strong>{money(bid.proposed_price)}</strong><span>{words(bid.status)}{bid.is_selected ? ' · Selected' : ''}</span></div></div>)}</div>{bidCollection.has_more && <button className="load-more-inline" onClick={loadMoreBids}>Load more Bids</button>}</article>}
        </main>
      </div>

      <AdminJobDecisionModal
        open={Boolean(decision)}
        action={decisionAction}
        requirements={decisionRequirements}
        impact={decisionImpact}
        submitting={submitting}
        error={decisionError}
        onClose={() => { if (!submitting) { setDecision(null); setDecisionKey(null); } }}
        onSubmit={submitDecision}
      />
      <AdminModal open={Boolean(media)} titleId="admin-job-media-title" onClose={() => setMedia(null)} className="job-media-dialog">
        {media && <><header><h2 id="admin-job-media-title">{media.type === 'evidence' ? `${words(media.stage)} Evidence` : `Job image ${media.position}`}</h2><button type="button" aria-label="Close media preview" onClick={() => setMedia(null)}>×</button></header><img src={media.url} alt={media.type === 'evidence' ? `${words(media.stage)} Evidence` : `Job image ${media.position}`} /></>}
      </AdminModal>
    </div>
  );
};

export default AdminJobDetailPage;
