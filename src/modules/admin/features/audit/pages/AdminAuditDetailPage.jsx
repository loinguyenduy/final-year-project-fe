import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaHistory } from 'react-icons/fa';
import { ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import { getAdminAuditLog } from '../../../services/adminAuditService';
import './AdminAudit.scss';

const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const SafeState = ({ title, state }) => {
  const entries = Object.entries(state || {});
  return <section className="audit-state"><h2>{title}</h2>{!entries.length ? <p>No structured state is available.</p> : <dl>{entries.map(([key, value]) => <div key={key}><dt>{words(key)}</dt><dd>{Array.isArray(value) ? <div className="audit-value-list">{value.map((item) => <span key={item}>{displayValue(item)}</span>)}</div> : value && typeof value === 'object' ? <dl className="audit-nested-list">{Object.entries(value).map(([nestedKey, nestedValue]) => <div key={nestedKey}><dt>{words(nestedKey)}</dt><dd>{displayValue(nestedValue)}</dd></div>)}</dl> : displayValue(value)}</dd></div>)}</dl>}</section>;
};

const AdminAuditDetailPage = () => {
  const { auditId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const load = () => {
    const controller = new AbortController();
    setLoading(true); setError('');
    getAdminAuditLog(auditId, controller.signal).then((response) => {
      if (mountedRef.current) setData(response.DT);
    }).catch((requestError) => {
      if (mountedRef.current && requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load the Audit record.');
    }).finally(() => { if (mountedRef.current) setLoading(false); });
    return controller;
  };
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => { const controller = load(); return () => controller.abort(); }, [auditId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading && !data) return <div className="admin-audit-detail"><LoadingState message="Loading Audit detail..." /></div>;
  if (error && !data) return <div className="admin-audit-detail"><Link className="audit-back" to={location.state?.from || '/admin/audit'}><FaArrowLeft /> Back to Audit Log</Link><ErrorState message={error} onRetry={load} /></div>;
  return <div className="admin-audit-detail">
    <Link className="audit-back" to={location.state?.from || '/admin/audit'}><FaArrowLeft /> Back to Audit Log</Link>
    <header className="audit-detail-header"><div><span>Immutable Administrator record</span><h1>{data.action_label}</h1><p>{data.summary}</p><div><StatusBadge status={data.category} />{data.detail_availability === 'SUMMARY_ONLY' && <StatusBadge status="SUMMARY_ONLY" />}</div></div><FaHistory /></header>
    {data.detail_availability === 'SUMMARY_ONLY' && <div className="audit-summary-only" role="note">This action is not mapped to a structured sanitizer. Only its safe summary and identifiers are available.</div>}
    <section className="audit-detail-meta"><dl>
      <div><dt>Audit ID</dt><dd>{data.audit_id}</dd></div><div><dt>Created</dt><dd>{new Date(data.created_at).toLocaleString('en-US')}</dd></div>
      <div><dt>Administrator</dt><dd>{data.administrator?.full_name || 'Unknown'}<small>{data.administrator?.email}</small></dd></div>
      <div><dt>Target</dt><dd>{words(data.target.type)}<small>{data.target.id}</small>{data.target.destination && <Link to={data.target.destination}>Open target <FaExternalLinkAlt /></Link>}</dd></div>
      <div><dt>Reason</dt><dd>{words(data.reason_code) || 'No reason code'}{data.reason_text && <small>{data.reason_text}</small>}</dd></div>
      <div><dt>Correlation ID</dt><dd>{data.correlation_id}</dd></div>
    </dl></section>
    <div className="audit-transition"><SafeState title="Previous state" state={data.previous_state} /><div className="audit-transition-arrow" aria-hidden="true">→</div><SafeState title="New state" state={data.new_state} /></div>
  </div>;
};

export default AdminAuditDetailPage;
