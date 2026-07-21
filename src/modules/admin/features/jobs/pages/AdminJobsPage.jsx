import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowRight,
  FaBriefcase,
  FaFilter,
  FaSearch,
  FaSlidersH,
  FaUserShield
} from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import { listAdminJobs } from '../../../services/adminJobService';
import './AdminJobs.scss';

const DEFAULTS = Object.freeze({
  page: '1',
  page_size: '20',
  status: 'ALL',
  needs_review: '',
  review_type: 'ALL',
  participant_role: 'ALL',
  sort: 'CREATED_DESC'
});

const JOB_STATUSES = [
  'ALL', 'POSTED', 'BIDDING', 'PENDING_DEPOSIT', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED',
  'QUOTE_PENDING', 'PAYMENT_PENDING', 'CANCELLATION_REVIEW', 'IN_PROGRESS', 'WARRANTY',
  'CLOSED', 'CANCELLED'
];

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
const money = (value) => value == null ? '—' : `${Number(value).toLocaleString('en-US')} VND`;

const AdminJobsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], pagination: { page: 1, total_pages: 1, total_items: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');
  const abortRef = useRef(null);
  const realtimeTimer = useRef(null);

  const filters = useMemo(() => {
    const values = Object.fromEntries(searchParams.entries());
    return {
      page: values.page || DEFAULTS.page,
      page_size: values.page_size || DEFAULTS.page_size,
      status: values.status || DEFAULTS.status,
      needs_review: values.needs_review ?? DEFAULTS.needs_review,
      review_type: values.review_type || DEFAULTS.review_type,
      participant_role: values.participant_role || DEFAULTS.participant_role,
      sort: values.sort || DEFAULTS.sort,
      search: values.search || '',
      service_id: values.service_id || '',
      participant_user_id: values.participant_user_id || '',
      acceptance_cycle: values.acceptance_cycle || '',
      has_selected_handyman: values.has_selected_handyman ?? '',
      created_from: values.created_from || '',
      created_to: values.created_to || ''
    };
  }, [searchParams]);

  const loadJobs = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    setError('');
    try {
      const requestParams = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
      const response = await listAdminJobs(requestParams, controller.signal);
      setData(response.DT || { items: [], pagination: { page: 1, total_pages: 1, total_items: 0 } });
    } catch (requestError) {
      if (requestError?.name !== 'CanceledError' && requestError?.code !== 'ERR_CANCELED') {
        setError(requestError?.EM || 'Unable to load Jobs.');
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadJobs();
    return () => abortRef.current?.abort();
  }, [loadJobs]);

  useEffect(() => {
    if (searchParams.get('legacy_case_unavailable') !== 'true') return;
    toast.warning('The legacy Review bookmark could not be resolved. Showing Jobs that currently require review.');
    const next = new URLSearchParams(searchParams);
    next.delete('legacy_case_unavailable');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const refresh = () => {
      window.clearTimeout(realtimeTimer.current);
      realtimeTimer.current = window.setTimeout(() => void loadJobs({ silent: true }), 250);
    };
    window.addEventListener('admin:job-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(realtimeTimer.current);
      window.removeEventListener('admin:job-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [loadJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchDraft.trim().replace(/\s+/g, ' ');
      if (normalized === filters.search) return;
      const next = new URLSearchParams(searchParams);
      normalized ? next.set('search', normalized) : next.delete('search');
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search, searchDraft, searchParams, setSearchParams]);

  const updateFilter = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    const defaultValue = DEFAULTS[key];
    if (value === '' || value === defaultValue) next.delete(key);
    else next.set(key, value);
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams());
  };

  const pagination = data.pagination || {};
  const page = Number(pagination.page || filters.page || 1);
  const totalPages = Math.max(1, Number(pagination.total_pages || 1));
  const pageNumbers = Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
    return start + index;
  }).filter((number) => number <= totalPages);

  return (
    <div className="admin-jobs-page">
      <header className="jobs-page-heading">
        <div>
          <p className="admin-eyebrow">Operations workspace</p>
          <h2>Job Management</h2>
          <p>Inspect every service lifecycle, participant, review case and financial record from one place.</p>
        </div>
        <div className="jobs-total"><strong>{pagination.total_items || 0}</strong><span>Jobs</span></div>
      </header>

      <section className="jobs-filter-panel" aria-label="Job filters">
        <div className="jobs-filter-primary">
          <label className="jobs-search">
            <FaSearch />
            <span className="sr-only">Search Jobs</span>
            <input
              value={searchDraft}
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Job ID, service or participant"
            />
          </label>
          <label><span>Status</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              {JOB_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label><span>Review</span>
            <select value={filters.needs_review} onChange={(event) => updateFilter('needs_review', event.target.value)}>
              <option value="">All Jobs</option>
              <option value="true">Needs Admin review</option>
              <option value="false">No pending review</option>
            </select>
          </label>
          <label><span>Sort</span>
            <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
              <option value="CREATED_DESC">Newest created</option>
              <option value="CREATED_ASC">Oldest created</option>
              <option value="UPDATED_DESC">Recently updated</option>
              <option value="UPDATED_ASC">Least recently updated</option>
              <option value="REVIEW_REQUIRED_FIRST">Reviews first</option>
            </select>
          </label>
          <button type="button" className="jobs-advanced-toggle" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}>
            <FaSlidersH /> Advanced
          </button>
        </div>

        {advancedOpen && (
          <div className="jobs-filter-advanced">
            <label><span>Review type</span>
              <select value={filters.review_type} onChange={(event) => updateFilter('review_type', event.target.value)}>
                <option value="ALL">All types</option>
                <option value="WARRANTY_CLAIM">Warranty claim</option>
                <option value="WARRANTY_REWORK">Warranty rework</option>
                <option value="CANCELLATION">Cancellation</option>
              </select>
            </label>
            <label><span>Participant role</span>
              <select value={filters.participant_role} onChange={(event) => updateFilter('participant_role', event.target.value)}>
                <option value="ALL">Any role</option><option value="CUSTOMER">Customer</option><option value="HANDYMAN">Handyman</option>
              </select>
            </label>
            <label><span>Participant user ID</span><input key={`participant-${filters.participant_user_id}`} defaultValue={filters.participant_user_id} onBlur={(event) => updateFilter('participant_user_id', event.target.value.trim())} placeholder="UUID" /></label>
            <label><span>Service ID</span><input key={`service-${filters.service_id}`} defaultValue={filters.service_id} onBlur={(event) => updateFilter('service_id', event.target.value.trim())} placeholder="UUID" /></label>
            <label><span>Acceptance cycle</span><input type="number" min="1" value={filters.acceptance_cycle} onChange={(event) => updateFilter('acceptance_cycle', event.target.value)} /></label>
            <label><span>Selected Handyman</span>
              <select value={filters.has_selected_handyman} onChange={(event) => updateFilter('has_selected_handyman', event.target.value)}>
                <option value="">Any</option><option value="true">Selected</option><option value="false">Not selected</option>
              </select>
            </label>
            <label><span>Created from</span><input type="date" value={filters.created_from} onChange={(event) => updateFilter('created_from', event.target.value)} /></label>
            <label><span>Created to</span><input type="date" value={filters.created_to} onChange={(event) => updateFilter('created_to', event.target.value)} /></label>
            <label><span>Page size</span>
              <select value={filters.page_size} onChange={(event) => updateFilter('page_size', event.target.value)}>
                {[20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <button type="button" className="jobs-clear-filters" onClick={clearFilters}><FaFilter /> Clear filters</button>
          </div>
        )}
      </section>

      {loading ? <LoadingState message="Loading Jobs..." /> : error ? (
        <ErrorState message={error} onRetry={() => loadJobs()} />
      ) : !data.items?.length ? (
        <EmptyState icon={<FaBriefcase />} message="No Jobs match the current filters." />
      ) : (
        <>
          <div className="jobs-table-wrap">
            <table className="jobs-table">
              <thead><tr><th>Job</th><th>Participants</th><th>Lifecycle</th><th>Financial</th><th>Review</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>{data.items.map((job) => (
                <tr key={job.id}>
                  <td data-label="Job"><button type="button" className="job-title-link" onClick={() => navigate(`/admin/jobs/${job.id}`)}>{job.display_title}</button><code>{job.id}</code><small>{job.address_summary || 'No address summary'}</small></td>
                  <td data-label="Participants"><strong>{job.customer?.full_name || 'Unknown customer'}</strong><span>{job.selected_handyman?.full_name || 'No Handyman selected'}</span></td>
                  <td data-label="Lifecycle"><StatusBadge status={job.status} /><span>Cycle {job.acceptance_cycle || '—'} · {job.bid_count} bids</span><small>{formatDate(job.updated_at)}</small></td>
                  <td data-label="Financial"><strong>{money(job.budget?.final_agreed_price)}</strong><span>{job.contract?.status || 'No contract'} · {job.warranty?.status || 'No warranty'}</span></td>
                  <td data-label="Review">{job.needs_review ? <div className="review-required"><FaUserShield /><strong>Action required</strong><span>{job.pending_review_types.join(', ').replaceAll('_', ' ')}</span></div> : <span className="review-clear">No pending review</span>}</td>
                  <td><button type="button" className="job-open-button" aria-label={`Open ${job.display_title}`} onClick={() => navigate(`/admin/jobs/${job.id}`)}><FaArrowRight /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <nav className="jobs-pagination" aria-label="Job pages">
            <button disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1), { resetPage: false })}>Previous</button>
            <div>{pageNumbers.map((number) => <button key={number} className={number === page ? 'active' : ''} aria-current={number === page ? 'page' : undefined} onClick={() => updateFilter('page', String(number), { resetPage: false })}>{number}</button>)}</div>
            <button disabled={page >= totalPages} onClick={() => updateFilter('page', String(page + 1), { resetPage: false })}>Next</button>
          </nav>
        </>
      )}
    </div>
  );
};

export default AdminJobsPage;
