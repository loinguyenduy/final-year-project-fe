import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch, FaSlidersH, FaUserShield } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../components/AdminStates';
import { getAdminUsers } from '../../../services/adminUserService';
import './AdminUsers.scss';

const DEFAULTS = { page: '1', page_size: '20', role: 'ALL', is_active: 'ALL', email_verified: 'ALL', kyc_status: 'ALL', handyman_level: 'ALL', security_bond_status: 'ALL', created_from: '', created_to: '', sort: 'CREATED_DESC', search: '' };
const money = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, searchParams.get(key) ?? DEFAULTS[key]]));
  const [searchDraft, setSearchDraft] = useState(params.search);
  const [result, setResult] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = (changes) => {
    const next = { ...params, ...changes };
    if (!Object.hasOwn(changes, 'page')) next.page = '1';
    const query = {};
    Object.entries(next).forEach(([key, value]) => { if (value !== '' && value !== DEFAULTS[key]) query[key] = value; });
    setSearchParams(query);
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (searchDraft !== params.search) update({ search: searchDraft }); }, 350);
    return () => clearTimeout(timer);
  }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (background = false, signal) => {
    if (!background) setLoading(true);
    setError('');
    try {
      const response = await getAdminUsers(params, signal);
      setResult(response.DT);
    } catch (requestError) {
      if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load users.');
    } finally { if (!background) setLoading(false); }
  }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const controller = new AbortController(); void load(false, controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => { const onFocus = () => void load(true); window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, [load]);

  const reset = () => { setSearchDraft(''); setSearchParams({}); };
  return (
    <div className="admin-users-page">
      <PageHeader title="Users" description="Review participant profiles, account status and operational impact." />
      <div className="users-toolbar">
        <label className="users-search"><FaSearch /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search ID, name, email or phone" /></label>
        <button type="button" className="filter-toggle" onClick={() => setFiltersOpen((value) => !value)}><FaSlidersH /> Filters</button>
      </div>
      <div className={`users-filters ${filtersOpen ? 'open' : ''}`}>
        <label>Role<select value={params.role} onChange={(e) => update({ role: e.target.value })}><option>ALL</option><option>CUSTOMER</option><option>HANDYMAN</option></select></label>
        <label>Status<select value={params.is_active} onChange={(e) => update({ is_active: e.target.value })}><option>ALL</option><option value="true">ACTIVE</option><option value="false">INACTIVE</option></select></label>
        <label>Email verified<select value={params.email_verified} onChange={(e) => update({ email_verified: e.target.value })}><option>ALL</option><option value="true">VERIFIED</option><option value="false">UNVERIFIED</option></select></label>
        <label>KYC<select value={params.kyc_status} onChange={(e) => update({ kyc_status: e.target.value })}><option>ALL</option><option>UNVERIFIED</option><option>PENDING</option><option>VERIFIED</option><option>REJECTED</option></select></label>
        <label>Level<select value={params.handyman_level} onChange={(e) => update({ handyman_level: e.target.value })}><option>ALL</option><option>C0</option><option>C1</option><option>C2</option><option>C3</option></select></label>
        <label>Bond<select value={params.security_bond_status} onChange={(e) => update({ security_bond_status: e.target.value })}><option>ALL</option><option>UNPAID</option><option>PAID</option><option>REFUNDED</option></select></label>
        <label>Created from<input type="date" value={params.created_from} onChange={(e) => update({ created_from: e.target.value })} /></label>
        <label>Created to<input type="date" value={params.created_to} onChange={(e) => update({ created_to: e.target.value })} /></label>
        <label>Sort<select value={params.sort} onChange={(e) => update({ sort: e.target.value })}><option>CREATED_DESC</option><option>CREATED_ASC</option><option>UPDATED_DESC</option><option>NAME_ASC</option><option>NAME_DESC</option></select></label>
        <button type="button" onClick={reset}>Reset filters</button>
      </div>
      {loading ? <LoadingState message="Loading users..." /> : error ? <ErrorState message={error} onRetry={() => load()} /> : !result.items.length ? <EmptyState icon={<FaUserShield />} message="No participants match these filters." /> : <>
        <div className="users-table" role="table">
          <div className="users-row users-head" role="row"><span>User</span><span>Role</span><span>Trust</span><span>Jobs</span><span>Wallet</span><span>Status</span></div>
          {result.items.map((user) => <button type="button" className="users-row" role="row" key={user.user_id} onClick={() => navigate(`/admin/users/${user.user_id}`)}>
            <span className="user-cell"><span className="user-avatar">{user.full_name?.slice(0, 1)}</span><span><strong>{user.full_name}</strong><small>{user.email}</small><small>{user.phone_number || user.user_id}</small></span></span>
            <span><StatusBadge status={user.role} /></span>
            <span><strong>{user.kyc_status}</strong><small>{user.handyman ? `${user.handyman.level} · ${user.handyman.security_bond_status}` : `${user.rating.average} ★ (${user.rating.count})`}</small></span>
            <span><strong>{user.job_counts.total}</strong><small>{user.job_counts.active} active</small></span>
            <span><strong>{user.wallets[0] ? money(user.wallets[0].available_balance, user.wallets[0].currency) : '—'}</strong><small>{user.wallets.length} wallet(s)</small></span>
            <span><StatusBadge status={user.is_active ? 'ACTIVE' : 'INACTIVE'} />{user.active_job_warning && <small className="warning-copy">Active Job impact</small>}</span>
          </button>)}
        </div>
        <div className="users-pagination"><span>{result.pagination.total_items} users</span><div><button disabled={result.pagination.page <= 1} onClick={() => update({ page: String(result.pagination.page - 1) })}>Previous</button><span>Page {result.pagination.page} / {result.pagination.total_pages || 1}</span><button disabled={result.pagination.page >= result.pagination.total_pages} onClick={() => update({ page: String(result.pagination.page + 1) })}>Next</button></div></div>
      </>}
    </div>
  );
};

export default AdminUsersPage;
