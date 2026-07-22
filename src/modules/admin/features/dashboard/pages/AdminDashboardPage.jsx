import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
  FaArrowRight, FaBriefcase, FaChartLine, FaClock, FaExclamationTriangle,
  FaMoneyBillWave, FaShieldAlt, FaUsers
} from 'react-icons/fa';
import { ErrorState, LoadingState, PageHeader } from '../../../components/AdminStates';
import { getAdminDashboard } from '../../../services/adminDashboardService';
import './AdminDashboard.scss';

const PERIODS = ['7D', '30D', '90D', '12M'];
const formatCount = (value) => Number(value || 0).toLocaleString('en-US');
const formatMoney = (value) => {
  if (!/^\d+$/.test(String(value ?? ''))) return 'Unavailable';
  try { return `${BigInt(value).toLocaleString('en-US')} VND`; }
  catch { return 'Unavailable'; }
};
const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatTime = (value) => value ? new Date(value).toLocaleString('en-US') : '—';
const safeMoneyChartData = (points = []) => {
  const maximum = BigInt(Number.MAX_SAFE_INTEGER);
  const converted = [];
  for (const point of points) {
    if (!/^\d+$/.test(String(point.value ?? ''))) return null;
    const value = BigInt(point.value);
    if (value > maximum) return null;
    converted.push({ ...point, chart_value: Number(value) });
  }
  return converted;
};

const Metric = ({ label, value, unit, to, unavailable = false }) => {
  const content = <><span>{label}</span><strong>{unavailable ? 'Unavailable' : value}</strong>{unit && !unavailable && <small>{unit}</small>}</>;
  return to ? <Link className="dashboard-metric" to={to}>{content}<FaArrowRight aria-hidden="true" /></Link>
    : <div className="dashboard-metric">{content}</div>;
};

const ChartPanel = ({ title, description, children, empty = false }) => (
  <article className="dashboard-chart-panel">
    <header><div><h3>{title}</h3><p>{description}</p></div><FaChartLine aria-hidden="true" /></header>
    {empty ? <div className="chart-empty">No data for this period.</div> : children}
  </article>
);

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPeriod = String(searchParams.get('period') || '30D').toUpperCase();
  const period = PERIODS.includes(rawPeriod) ? rawPeriod : '30D';
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const trailingRefreshRef = useRef(false);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async ({ background = false, replace = false } = {}) => {
    if (!mountedRef.current) return;
    if (background && inFlightRef.current) {
      trailingRefreshRef.current = true;
      return;
    }
    if (replace) controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    inFlightRef.current = true;
    if (background && data) setRefreshing(true);
    else setInitialLoading(true);
    setError('');
    try {
      const response = await getAdminDashboard(period, controller.signal);
      if (mountedRef.current && requestId === requestIdRef.current) setData(response.DT);
    } catch (requestError) {
      if (mountedRef.current && requestError?.code !== 'ERR_CANCELED' && requestId === requestIdRef.current) {
        setError(requestError?.EM || 'Unable to load the Administrator Dashboard.');
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        inFlightRef.current = false;
        setInitialLoading(false);
        setRefreshing(false);
        if (trailingRefreshRef.current) {
          trailingRefreshRef.current = false;
          window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => void load({ background: true }), 0);
        }
      }
    }
  }, [data, period]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      window.clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (rawPeriod !== period) setSearchParams({ period }, { replace: true });
    void load({ replace: true });
    return () => controllerRef.current?.abort();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => void load({ background: true }), 450);
    };
    const events = ['admin:kyc-queue-updated', 'admin:review-queue-updated', 'admin:job-updated'];
    events.forEach((eventName) => window.addEventListener(eventName, schedule));
    window.addEventListener('focus', schedule);
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, schedule));
      window.removeEventListener('focus', schedule);
      window.clearTimeout(debounceRef.current);
    };
  }, [load]);

  const jobTimeData = data?.charts?.jobs_created_over_time || [];
  const statusData = data?.charts?.jobs_created_in_period_by_current_status || [];
  const registrationData = useMemo(() => {
    const customers = data?.charts?.participant_registrations_over_time?.customers || [];
    const handymen = new Map((data?.charts?.participant_registrations_over_time?.handymen || []).map((point) => [point.bucket, point.value]));
    return customers.map((point) => ({ bucket: point.bucket, customers: point.value, handymen: handymen.get(point.bucket) || 0 }));
  }, [data]);
  const feePoints = data?.charts?.successful_platform_fees_over_time?.points || [];
  const safeFeeData = useMemo(() => safeMoneyChartData(data?.charts?.successful_platform_fees_over_time?.points || []), [data]);

  if (initialLoading && !data) return <div className="admin-dashboard-page"><LoadingState message="Loading canonical Dashboard metrics..." /></div>;
  if (error && !data) return <div className="admin-dashboard-page"><ErrorState message={error} onRetry={() => load({ replace: true })} /></div>;

  const users = data?.users || {};
  const trust = data?.trust_and_safety || {};
  const jobs = data?.jobs || {};
  const finance = data?.finance || {};

  return (
    <div className="admin-dashboard-page">
      <PageHeader
        title="Operations Dashboard"
        description={`Canonical platform overview · ${data?.period?.timezone || 'Asia/Ho_Chi_Minh'}`}
        aside={<div className="dashboard-period" aria-label="Dashboard reporting period">{PERIODS.map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setSearchParams({ period: item })}>{item}</button>)}</div>}
      />
      {refreshing && <div className="dashboard-refresh" role="status">Refreshing Dashboard data...</div>}
      {error && <div className="dashboard-inline-error" role="alert">{error} <button onClick={() => load({ background: true })}>Retry</button></div>}

      <section className="dashboard-hero">
        <div><span>Selected reporting window</span><strong>{data?.period?.key}</strong><small>{formatTime(data?.period?.starts_at)} — {formatTime(data?.period?.ends_at)}</small></div>
        <div><span>Generated</span><strong>{formatTime(data?.generated_at)}</strong><small>REST/database canonical snapshot</small></div>
      </section>

      <section className="dashboard-group">
        <header><FaUsers /><div><h2>Users & Trust</h2><p>Participant growth, account state and trust readiness.</p></div></header>
        <div className="dashboard-metric-grid">
          <Metric label="Customers" value={formatCount(users.total_customers)} unit={`${formatCount(users.active_customers)} active`} to="/admin/users?role=CUSTOMER" />
          <Metric label="Handymen" value={formatCount(users.total_handymen)} unit={`${formatCount(users.active_handymen)} active`} to="/admin/users?role=HANDYMAN" />
          <Metric label="New participants" value={formatCount(Number(users.new_customers_in_period || 0) + Number(users.new_handymen_in_period || 0))} unit="participants in period" />
          <Metric label="Pending KYC" value={formatCount(trust.pending_kyc)} unit="submissions" to="/admin/kyc" />
          <Metric label="Verified participants" value={formatCount(Number(trust.verified_customers || 0) + Number(trust.verified_handymen || 0))} unit="participants" />
          <Metric label="Active security bonds" value={formatCount(trust.active_security_bonds)} unit="Handyman bonds" />
        </div>
      </section>

      <section className="dashboard-group">
        <header><FaBriefcase /><div><h2>Jobs & Operations</h2><p>All-time lifecycle state and selected-period activity.</p></div></header>
        <div className="dashboard-metric-grid">
          <Metric label="All Jobs" value={formatCount(jobs.total_jobs)} unit="jobs" to="/admin/jobs" />
          <Metric label="Active Jobs" value={formatCount(jobs.active_jobs)} unit="jobs" to="/admin/jobs" />
          <Metric label="Created in period" value={formatCount(jobs.jobs_created_in_period)} unit="jobs" />
          <Metric label="Jobs needing review" value={formatCount(jobs.distinct_jobs_needing_review)} unit="distinct jobs" to="/admin/jobs?needs_review=true" />
          <Metric label="Pending review cases" value={formatCount(jobs.pending_review_cases?.total_cases)} unit="cases" to="/admin/jobs?needs_review=true" />
          <Metric label="Closed / Cancelled" value={`${formatCount(jobs.closed_jobs)} / ${formatCount(jobs.cancelled_jobs)}`} unit="jobs" />
        </div>
      </section>

      <section className="dashboard-group">
        <header><FaMoneyBillWave /><div><h2>Finance</h2><p>Read-only VND ledger and system Wallet indicators.</p></div></header>
        <div className="dashboard-metric-grid finance">
          <Metric label="System Escrow" value={formatMoney(finance.system_escrow_balance?.value)} unavailable={finance.system_escrow_balance?.availability !== 'AVAILABLE'} to="/admin/wallets?wallet_type=SYSTEM_ESCROW" />
          <Metric label="System Profit" value={formatMoney(finance.system_profit_balance?.value)} unavailable={finance.system_profit_balance?.availability !== 'AVAILABLE'} to="/admin/wallets?wallet_type=SYSTEM_PROFIT" />
          <Metric label="Platform fees in period" value={formatMoney(finance.successful_platform_fee_in_period?.value)} unavailable={finance.successful_platform_fee_in_period?.availability !== 'AVAILABLE'} to="/admin/transactions?type=PLATFORM_SERVICE_FEE&status=SUCCESS" />
          <Metric label="Successful transactions" value={formatCount(finance.successful_transaction_count_in_period)} unit="transactions" to="/admin/transactions?status=SUCCESS" />
          <Metric label="Global Warranty Reserve" value="Unavailable" unavailable />
        </div>
      </section>

      <section className="dashboard-action-section">
        <header><FaExclamationTriangle /><div><h2>Action Required</h2><p>Counts preserve their canonical unit; cases are never presented as distinct Jobs.</p></div></header>
        <div className="dashboard-action-list">{(data?.action_queue || []).map((item) => (
          <Link key={item.type} to={item.destination} className={`dashboard-action ${item.severity.toLowerCase()}`}>
            <div><span>{words(item.type)}</span><p>{item.description}</p></div>
            <strong>{formatCount(item.count)} <small>{item.unit}</small></strong><FaArrowRight />
          </Link>
        ))}</div>
      </section>

      <section className="dashboard-charts" aria-label="Dashboard charts">
        <ChartPanel title="Jobs created over time" description="New Jobs grouped in the selected operating period." empty={!jobTimeData.some((item) => item.value)}>
          <div className="chart-canvas" role="img" aria-label="Line chart of Jobs created over time"><ResponsiveContainer width="100%" height="100%"><LineChart data={jobTimeData} accessibilityLayer><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="bucket" minTickGap={22} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="value" name="Jobs" stroke="#ea580c" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </ChartPanel>
        <ChartPanel title="Jobs by current status" description="Current status of Jobs created inside the selected period." empty={!statusData.some((item) => item.count)}>
          <div className="chart-canvas" role="img" aria-label="Bar chart of selected-period Jobs by current status"><ResponsiveContainer width="100%" height="100%"><BarChart data={statusData} accessibilityLayer><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="status" tickFormatter={(value) => words(value).replace(' ', '\n')} interval={0} angle={-24} textAnchor="end" height={78} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={words} /><Bar dataKey="count" name="Jobs" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </ChartPanel>
        <ChartPanel title="Participant registrations" description="Customer and Handyman registrations over time." empty={!registrationData.some((item) => item.customers || item.handymen)}>
          <div className="chart-canvas" role="img" aria-label="Line chart of Customer and Handyman registrations"><ResponsiveContainer width="100%" height="100%"><LineChart data={registrationData} accessibilityLayer><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="bucket" minTickGap={22} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="customers" name="Customers" stroke="#ea580c" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="handymen" name="Handymen" stroke="#334155" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </ChartPanel>
        <ChartPanel title="Successful platform fees" description="Canonical PLATFORM_SERVICE_FEE revenue paid into System Profit." empty={!feePoints.some((item) => item.value !== '0')}>
          {safeFeeData ? <div className="chart-canvas" role="img" aria-label="Bar chart of successful platform fees in VND"><ResponsiveContainer width="100%" height="100%"><BarChart data={safeFeeData} accessibilityLayer><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="bucket" minTickGap={22} /><YAxis tickFormatter={(value) => Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)} /><Tooltip formatter={(value) => formatMoney(String(value))} /><Bar dataKey="chart_value" name="Platform fee" fill="#ea580c" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            : <div className="chart-safe-fallback"><strong>Values are too large to chart safely.</strong><p>Exact amounts remain available in the Finance KPI and Transaction module.</p></div>}
        </ChartPanel>
      </section>

      <section className="dashboard-activity">
        <header><FaClock /><div><h2>Recent Activity</h2><p>Latest bounded operational activity. Missing actors remain intentionally blank.</p></div></header>
        <div className="activity-timeline">{(data?.recent_activity || []).map((item) => (
          <article key={item.id}><span className="activity-dot" /><div><strong>{item.summary}</strong><p>{item.actor?.kind === 'ADMIN' ? item.actor.full_name : item.actor?.kind === 'SYSTEM' ? 'System' : 'No administrator actor'}</p><time>{formatTime(item.occurred_at)}</time></div>{item.destination && <Link to={item.destination} aria-label={`Open ${item.summary}`}><FaArrowRight /></Link>}</article>
        ))}{!data?.recent_activity?.length && <div className="chart-empty"><FaShieldAlt /> No recent operational activity.</div>}</div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
