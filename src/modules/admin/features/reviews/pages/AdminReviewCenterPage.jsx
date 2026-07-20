import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { FaArrowRight, FaFilter, FaSearch } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState } from '../../../components/AdminStates';
import { listAdminReviewCases } from '../../../services/adminReviewService';
import './AdminReviewCenterPage.scss';

const CASE_LABELS = {
  WARRANTY_CLAIM: 'Warranty claim',
  WARRANTY_REWORK: 'Rework review',
  CANCELLATION: 'Cancellation'
};

const DEFAULTS = Object.freeze({ status: 'PENDING', case_type: 'ALL', sort: 'OLDEST', search: '' });

const AdminReviewCenterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshQueueCounts } = useOutletContext();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ has_more: false, next_cursor: null, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');

  const filters = useMemo(() => ({
    status: searchParams.get('status') || DEFAULTS.status,
    case_type: searchParams.get('case_type') || DEFAULTS.case_type,
    sort: searchParams.get('sort') || DEFAULTS.sort,
    search: searchParams.get('search') || DEFAULTS.search,
    page_size: 20
  }), [searchParams]);

  const load = useCallback(async ({ append = false, cursor = null } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await listAdminReviewCases({ ...filters, ...(cursor ? { cursor } : {}) });
      const data = response?.DT || {};
      setItems((current) => append ? [...current, ...(data.items || [])] : (data.items || []));
      setPagination(data.pagination || { has_more: false, next_cursor: null, total_items: 0 });
    } catch (requestError) {
      setError(requestError?.response?.data?.EM || requestError?.EM || 'Unable to load review cases.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('admin:review-queue-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('admin:review-queue-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchDraft.trim().replace(/\s+/g, ' ');
      if (normalized === filters.search) return;
      const next = new URLSearchParams(searchParams);
      normalized ? next.set('search', normalized) : next.delete('search');
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search, searchDraft, searchParams, setSearchParams]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value === DEFAULTS[key] ? next.delete(key) : next.set(key, value);
    setSearchParams(next);
  };

  const refreshAll = () => {
    void load();
    void refreshQueueCounts();
  };

  return (
    <div className="admin-review-page">
      <header className="review-page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Review Center</h2>
          <p>Review warranty claims, disputed rework and lifecycle cancellations.</p>
        </div>
        <span className="review-total">{pagination.total_items || 0} cases</span>
      </header>

      <section className="review-filters" aria-label="Review filters">
        <label className="review-search"><FaSearch /><span className="sr-only">Search</span>
          <input value={searchDraft} maxLength={100} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Job ID, customer or handyman" />
        </label>
        <label><FaFilter /><span className="sr-only">Status</span>
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="PENDING">Pending</option><option value="RESOLVED">Resolved</option><option value="ALL">All</option>
          </select>
        </label>
        <label><span className="sr-only">Case type</span>
          <select value={filters.case_type} onChange={(event) => updateFilter('case_type', event.target.value)}>
            <option value="ALL">All case types</option><option value="WARRANTY_CLAIM">Warranty claims</option>
            <option value="WARRANTY_REWORK">Rework reviews</option><option value="CANCELLATION">Cancellations</option>
          </select>
        </label>
        <label><span className="sr-only">Sort order</span>
          <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
            <option value="OLDEST">Oldest first</option><option value="NEWEST">Newest first</option>
          </select>
        </label>
      </section>

      {loading ? <LoadingState label="Loading review cases..." /> : error ? <ErrorState message={error} onRetry={refreshAll} /> : items.length === 0 ? (
        <EmptyState title="No review cases" message="No cases match the current filters." />
      ) : (
        <div className="review-case-list">
          {items.map((item) => (
            <article className="review-case-card" key={`${item.case_type}:${item.case_id}`}>
              <div className="review-card-main">
                <div className="review-card-badges"><span>{CASE_LABELS[item.case_type]}</span><span className={`state ${item.review_status.toLowerCase()}`}>{item.review_status}</span></div>
                <h3>Job {item.job.id}</h3>
                <p>{item.job.service_name || item.job.issue_summary || 'Service request'}</p>
                <dl><div><dt>Customer</dt><dd>{item.parties.customer?.full_name || '—'}</dd></div><div><dt>Handyman</dt><dd>{item.parties.handyman?.full_name || '—'}</dd></div><div><dt>Review time</dt><dd>{new Date(item.review_sort_at).toLocaleString()}</dd></div></dl>
              </div>
              <button type="button" className="review-open" onClick={() => navigate(`/admin/reviews/${item.case_type}/${item.case_id}`, { state: { reviewSearch: searchParams.toString() } })}>Open <FaArrowRight /></button>
            </article>
          ))}
          {pagination.has_more && <button className="review-load-more" type="button" disabled={loadingMore} onClick={() => load({ append: true, cursor: pagination.next_cursor })}>{loadingMore ? 'Loading...' : 'Load more'}</button>}
        </div>
      )}
    </div>
  );
};

export default AdminReviewCenterPage;
