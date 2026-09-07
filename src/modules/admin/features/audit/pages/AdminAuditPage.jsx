import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FaCopy, FaFilter, FaHistory, FaSearch, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../components/AdminStates';
import { getAdminAuditFilterOptions, getAdminAuditLogs } from '../../../services/adminAuditService';
import './AdminAudit.scss';

const DEFAULTS = {
  page: '1', page_size: '20', search: '', category: 'ALL', action: 'ALL', admin_id: 'ALL',
  target_type: 'ALL', target_id: '', correlation_id: '', date_from: '', date_to: '', sort: 'CREATED_DESC'
};
const formatTime = (value) => value ? new Date(value).toLocaleString('en-US') : '—';
const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const CopyId = ({ value, label }) => <button type="button" className="audit-copy" aria-label={`Copy ${label}`} title={value} onClick={async (event) => {
  event.preventDefault();
  event.stopPropagation();
  try { await navigator.clipboard.writeText(value); toast.success(`${label} copied.`); }
  catch { toast.error(`Unable to copy ${label}.`); }
}}><span>{value}</span><FaCopy /></button>;

const AdminAuditPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, searchParams.get(key) ?? DEFAULTS[key]]));
  const [searchText, setSearchText] = useState(params.search);
  const [targetText, setTargetText] = useState(params.target_id);
  const [correlationText, setCorrelationText] = useState(params.correlation_id);
  const [data, setData] = useState(null);
  const [options, setOptions] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestRef = useRef(0);
  const controllerRef = useRef(null);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      const normalized = String(value ?? '');
      if (!normalized || normalized === DEFAULTS[key]) next.delete(key);
      else next.set(key, normalized);
    });
    if (!Object.hasOwn(changes, 'page')) next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    const controller = new AbortController();
    getAdminAuditFilterOptions(controller.signal).then((response) => setOptions(response.DT)).catch((requestError) => {
      if (requestError?.code !== 'ERR_CANCELED') toast.error(requestError?.EM || 'Unable to load Audit filter options.');
    });
    return () => controller.abort();
  }, []);

  const queryKey = searchParams.toString();
  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestRef.current;
    if (data) setRefreshing(true); else setInitialLoading(true);
    setError('');
    const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value && value !== 'ALL'));
    getAdminAuditLogs(query, controller.signal).then((response) => {
      if (requestId === requestRef.current) setData(response.DT);
    }).catch((requestError) => {
      if (requestError?.code !== 'ERR_CANCELED' && requestId === requestRef.current) setError(requestError?.EM || 'Unable to load Administrator Audit records.');
    }).finally(() => {
      if (requestId === requestRef.current) { setInitialLoading(false); setRefreshing(false); }
    });
    return () => {
      controller.abort();
      if (requestRef.current === requestId) requestRef.current += 1;
    };
  }, [queryKey, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSearchText(params.search);
    setTargetText(params.target_id);
    setCorrelationText(params.correlation_id);
  }, [params.search, params.target_id, params.correlation_id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchText.trim() !== params.search) update({ search: searchText.trim() });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (targetText.trim() !== params.target_id) update({ target_id: targetText.trim() });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [targetText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (correlationText.trim() !== params.correlation_id) update({ correlation_id: correlationText.trim() });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [correlationText]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilters = useMemo(() => Object.entries(params).filter(([key, value]) => !['page', 'page_size', 'sort', 'search'].includes(key) && value && value !== 'ALL'), [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const retry = () => setRefreshKey((value) => value + 1);
  if (initialLoading && !data) return <div className="admin-audit-page"><LoadingState message="Loading immutable Administrator Audit records..." /></div>;
  if (error && !data) return <div className="admin-audit-page"><ErrorState message={error} onRetry={retry} /></div>;

  return <div className="admin-audit-page">
    <PageHeader title="Audit Log" description="Read-only history of security and business actions performed by Administrators." aside={<button className="audit-refresh" onClick={retry} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>} />
    <div className="audit-toolbar">
      <label className="audit-search"><FaSearch /><span className="visually-hidden">Search Audit records</span><input value={searchText} maxLength={100} placeholder="Audit, action, target, correlation or Administrator" onChange={(event) => setSearchText(event.target.value)} /></label>
      <button className="audit-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><FaFilter /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}</button>
      <select aria-label="Audit sort" value={params.sort} onChange={(event) => update({ sort: event.target.value })}><option value="CREATED_DESC">Newest first</option><option value="CREATED_ASC">Oldest first</option></select>
    </div>
    <div className={`audit-filters ${filtersOpen ? 'open' : ''}`}>
      <label>Category<select value={params.category} onChange={(event) => update({ category: event.target.value, action: 'ALL' })}><option value="ALL">All categories</option>{(options?.categories || []).map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Action<select value={params.action} onChange={(event) => update({ action: event.target.value })}><option value="ALL">All actions</option>{(options?.actions || []).filter((item) => params.category === 'ALL' || item.category === params.category).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Administrator<select value={params.admin_id} onChange={(event) => update({ admin_id: event.target.value })}><option value="ALL">All Administrators</option>{(options?.administrators || []).map((item) => <option key={item.id} value={item.id}>{item.full_name} · {item.email}</option>)}</select></label>
      <label>Target type<select value={params.target_type} onChange={(event) => update({ target_type: event.target.value })}><option value="ALL">All target types</option>{(options?.target_types || []).map((item) => <option key={item} value={item}>{words(item)}</option>)}</select></label>
      <label>Target ID<input value={targetText} placeholder="UUID" onChange={(event) => setTargetText(event.target.value)} /></label>
      <label>Correlation ID<input value={correlationText} placeholder="UUID" onChange={(event) => setCorrelationText(event.target.value)} /></label>
      <label>From<input type="date" value={params.date_from} onChange={(event) => update({ date_from: event.target.value })} /></label>
      <label>To<input type="date" value={params.date_to} onChange={(event) => update({ date_to: event.target.value })} /></label>
      <button className="audit-reset" onClick={() => { setSearchText(''); setTargetText(''); setCorrelationText(''); setSearchParams({}); }}><FaTimes /> Reset all</button>
    </div>
    {activeFilters.length > 0 && <div className="audit-filter-chips">{activeFilters.map(([key, value]) => <button key={key} onClick={() => update({ [key]: DEFAULTS[key] })}>{words(key)}: {words(value)} <FaTimes /></button>)}</div>}
    {error && <div className="audit-inline-error" role="alert">{error} <button onClick={retry}>Retry</button></div>}
    {refreshing && <div className="audit-refreshing" role="status">Refreshing Audit records...</div>}
    {!data?.items?.length ? <EmptyState icon={<FaHistory />} message="No Audit records match the current filters." /> : <div className="audit-table">
      <div className="audit-row audit-head"><span>Time</span><span>Action</span><span>Administrator</span><span>Target</span><span>Reason / Summary</span><span>Correlation</span><span>Open</span></div>
      {data.items.map((item) => <article className="audit-row" key={item.audit_id}>
        <time>{formatTime(item.created_at)}</time>
        <div><StatusBadge status={item.category} /><strong>{item.action_label}</strong>{item.detail_availability === 'SUMMARY_ONLY' && <small>Summary only</small>}</div>
        <div><strong>{item.administrator?.full_name || 'Unknown Administrator'}</strong><small>{item.administrator?.email || 'No actor metadata'}</small></div>
        <div><span>{words(item.target.type)}</span><CopyId value={item.target.id} label="target ID" /></div>
        <div><strong>{words(item.reason_code) || 'No reason code'}</strong><small>{item.summary}</small></div>
        <CopyId value={item.correlation_id} label="correlation ID" />
        <Link className="audit-open" to={`/admin/audit/${item.audit_id}`} state={{ from: `${location.pathname}${location.search}` }} aria-label={`Open ${item.action_label}`}>Open</Link>
      </article>)}
    </div>}
    {data?.pagination && <div className="audit-pagination"><span>{formatCount(data.pagination.total_items)} Audit records</span><div><button disabled={data.pagination.page <= 1} onClick={() => update({ page: data.pagination.page - 1 })}>Previous</button><span>Page {data.pagination.page} / {data.pagination.total_pages || 1}</span><button disabled={data.pagination.page >= data.pagination.total_pages} onClick={() => update({ page: data.pagination.page + 1 })}>Next</button></div></div>}
  </div>;
};

const formatCount = (value) => Number(value || 0).toLocaleString('en-US');
export default AdminAuditPage;
