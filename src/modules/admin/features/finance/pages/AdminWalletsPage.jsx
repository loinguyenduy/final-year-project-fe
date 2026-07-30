import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaSearch, FaWallet } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../components/AdminStates';
import { getAdminWallets } from '../../../services/adminFinanceService';
import './AdminFinance.scss';

const DEFAULTS = { page: '1', page_size: '20', search: '', owner_role: 'ALL', wallet_type: 'ALL', status: 'ALL', currency: 'ALL', min_balance: '', max_balance: '', sort: 'UPDATED_DESC' };
const money = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));

const AdminWalletsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, searchParams.get(key) ?? DEFAULTS[key]]));
  const [draft, setDraft] = useState(params.search);
  const [data, setData] = useState({ items: [], scope_summary: [], pagination: null });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const update = (changes) => {
    const next = { ...params, ...changes, ...(Object.hasOwn(changes, 'page') ? {} : { page: '1' }) };
    const query = {}; Object.entries(next).forEach(([key, value]) => { if (value && value !== DEFAULTS[key]) query[key] = value; }); setSearchParams(query);
  };
  useEffect(() => { const timer = setTimeout(() => { if (draft !== params.search) update({ search: draft }); }, 350); return () => clearTimeout(timer); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(async (signal) => {
    const requestSignal = signal?.aborted === false ? signal : undefined;
    setLoading(true); setError('');
    try { setData((await getAdminWallets(params, requestSignal)).DT); }
    catch (requestError) { if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load Wallets.'); }
    finally { setLoading(false); }
  }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  return <div className="admin-finance-page">
    <PageHeader title="Wallets" description="Read-only balances and ledger activity across participant and system Wallets." aside={<Link className="finance-primary-link" to="/admin/transactions">Open transactions</Link>} />
    <div className="finance-summary-strip">{data.scope_summary.slice(0, 5).map((item) => <div key={`${item.currency}-${item.wallet_type}`}><span>{item.wallet_type}</span><strong>{money(item.available_balance, item.currency)}</strong><small>{item.wallet_count} wallet(s) in filtered scope</small></div>)}</div>
    <div className="finance-filters">
      <label className="finance-search"><FaSearch /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search owner" /></label>
      <select aria-label="Owner role" value={params.owner_role} onChange={(event) => update({ owner_role: event.target.value })}><option>ALL</option><option>CUSTOMER</option><option>HANDYMAN</option><option>SYSTEM</option></select>
      <select aria-label="Wallet type" value={params.wallet_type} onChange={(event) => update({ wallet_type: event.target.value })}><option>ALL</option><option>CUSTOMER_MAIN</option><option>HANDYMAN_MAIN</option><option>HANDYMAN_ESCROW</option><option>SYSTEM_ESCROW</option><option>SYSTEM_PROFIT</option></select>
      <select aria-label="Wallet status" value={params.status} onChange={(event) => update({ status: event.target.value })}><option>ALL</option><option>ACTIVE</option><option>BLOCKED</option></select>
    </div>
    <details className="finance-advanced"><summary>Balance, currency and sorting</summary><div>
      <label>Currency<input maxLength={3} value={params.currency === 'ALL' ? '' : params.currency} placeholder="ALL" onChange={(event) => update({ currency: event.target.value.toUpperCase() || 'ALL' })} /></label>
      <label>Minimum balance<input inputMode="decimal" value={params.min_balance} onChange={(event) => update({ min_balance: event.target.value })} /></label>
      <label>Maximum balance<input inputMode="decimal" value={params.max_balance} onChange={(event) => update({ max_balance: event.target.value })} /></label>
      <label>Sort<select value={params.sort} onChange={(event) => update({ sort: event.target.value })}><option>UPDATED_DESC</option><option>UPDATED_ASC</option><option>BALANCE_DESC</option><option>BALANCE_ASC</option><option>TYPE_ASC</option></select></label>
    </div></details>
    {loading ? <LoadingState message="Loading Wallets..." /> : error ? <ErrorState message={error} onRetry={() => load()} /> : !data.items.length ? <EmptyState icon={<FaWallet />} message="No Wallets match these filters." /> : <>
      <div className="finance-table wallet-table"><div className="finance-row finance-head"><span>Owner</span><span>Wallet</span><span>Balance</span><span>Ledger</span><span>Status</span></div>{data.items.map((wallet, index) => <div className="finance-row" key={`${wallet.wallet_type}-${wallet.owner.user_id || 'system'}-${index}`}><span><strong>{wallet.owner.full_name || wallet.owner.label}</strong><small>{wallet.owner.email || wallet.owner.role || wallet.owner.kind}</small></span><span><strong>{wallet.wallet_type}</strong><small>{wallet.currency}</small></span><span><strong>{money(wallet.available_balance, wallet.currency)}</strong><small>Updated {new Date(wallet.updated_at).toLocaleDateString()}</small></span><span><strong>{wallet.successful_transaction_count} successful</strong><small>In {money(wallet.total_incoming)} / Out {money(wallet.total_outgoing)}</small></span><span><StatusBadge status={wallet.status} />{wallet.owner.user_id && <Link to={`/admin/users/${wallet.owner.user_id}`}>Open user</Link>}</span></div>)}</div>
      <div className="finance-pagination"><span>{data.pagination.total_items} Wallets</span><button disabled={data.pagination.page <= 1} onClick={() => update({ page: String(data.pagination.page - 1) })}>Previous</button><span>Page {data.pagination.page}/{data.pagination.total_pages || 1}</span><button disabled={data.pagination.page >= data.pagination.total_pages} onClick={() => update({ page: String(data.pagination.page + 1) })}>Next</button></div>
    </>}
  </div>;
};
export default AdminWalletsPage;
