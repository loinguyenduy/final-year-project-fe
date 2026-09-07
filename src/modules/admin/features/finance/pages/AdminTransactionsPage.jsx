import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaExchangeAlt, FaSearch } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../components/AdminStates';
import { getAdminTransactions } from '../../../services/adminFinanceService';
import './AdminFinance.scss';

const DEFAULTS = { page: '1', page_size: '20', search: '', type: 'ALL', status: 'ALL', owner_role: 'ALL', wallet_type: 'ALL', direction: 'ALL', user_id: '', job_id: '', contract_id: '', acceptance_cycle: '', date_from: '', date_to: '', min_amount: '', max_amount: '', sort: 'CREATED_DESC' };
const money = (value, currency) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency || 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const partyName = (party) => party?.full_name || party?.label || 'External';

const AdminTransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, searchParams.get(key) ?? DEFAULTS[key]]));
  const [draft, setDraft] = useState(params.search); const [data, setData] = useState({ items: [], pagination: null }); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const update = (changes) => { const next = { ...params, ...changes, ...(Object.hasOwn(changes, 'page') ? {} : { page: '1' }) }; const query = {}; Object.entries(next).forEach(([key, value]) => { if (value && value !== DEFAULTS[key]) query[key] = value; }); setSearchParams(query); };
  useEffect(() => { const timer = setTimeout(() => { if (draft !== params.search) update({ search: draft }); }, 350); return () => clearTimeout(timer); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(async (signal) => { const requestSignal = signal?.aborted === false ? signal : undefined; setLoading(true); setError(''); try { setData((await getAdminTransactions(params, requestSignal)).DT); } catch (requestError) { if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load Transactions.'); } finally { setLoading(false); } }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  return <div className="admin-finance-page"><PageHeader title="Transactions" description="Canonical ledger explorer. All data is read-only." />
    <div className="finance-filters transaction-filters">
      <label className="finance-search"><FaSearch /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Transaction, provider reference or Job" /></label>
      <select aria-label="Transaction type" value={params.type} onChange={(event) => update({ type: event.target.value })}><option>ALL</option><option>TOP_UP</option><option>DEPOSIT_10</option><option>SERVICE_REMAINING_PAYMENT</option><option>HANDYMAN_PARTIAL_RELEASE</option><option>WARRANTY_RELEASE</option><option>WARRANTY_REFUND</option><option>CANCELLATION_REFUND</option><option>CANCELLATION_COMPENSATION</option><option>BONDING_DEPOSIT</option></select>
      <select aria-label="Transaction status" value={params.status} onChange={(event) => update({ status: event.target.value })}><option>ALL</option><option>PENDING</option><option>SUCCESS</option><option>FAILED</option><option>EXPIRED</option></select>
      <select aria-label="Transaction sorting" value={params.sort} onChange={(event) => update({ sort: event.target.value })}><option>CREATED_DESC</option><option>CREATED_ASC</option><option>AMOUNT_DESC</option><option>AMOUNT_ASC</option></select>
    </div>
    <details className="finance-advanced"><summary>Business and party filters</summary><div>
      <label>User ID<input value={params.user_id} onChange={(event) => update({ user_id: event.target.value.trim() })} /></label>
      <label>Direction<select value={params.direction} onChange={(event) => update({ direction: event.target.value })}><option>ALL</option><option>INCOMING</option><option>OUTGOING</option><option>INTERNAL</option></select></label>
      <label>Owner role<select value={params.owner_role} onChange={(event) => update({ owner_role: event.target.value })}><option>ALL</option><option>CUSTOMER</option><option>HANDYMAN</option></select></label>
      <label>Wallet type<select value={params.wallet_type} onChange={(event) => update({ wallet_type: event.target.value })}><option>ALL</option><option>CUSTOMER_MAIN</option><option>HANDYMAN_MAIN</option><option>HANDYMAN_ESCROW</option><option>SYSTEM_ESCROW</option><option>SYSTEM_PROFIT</option></select></label>
      <label>Job ID<input value={params.job_id} onChange={(event) => update({ job_id: event.target.value.trim() })} /></label>
      <label>Contract ID<input value={params.contract_id} onChange={(event) => update({ contract_id: event.target.value.trim() })} /></label>
      <label>Cycle<input type="number" min="1" value={params.acceptance_cycle} onChange={(event) => update({ acceptance_cycle: event.target.value })} /></label>
      <label>From<input type="date" value={params.date_from} onChange={(event) => update({ date_from: event.target.value })} /></label>
      <label>To<input type="date" value={params.date_to} onChange={(event) => update({ date_to: event.target.value })} /></label>
      <label>Minimum amount<input inputMode="decimal" value={params.min_amount} onChange={(event) => update({ min_amount: event.target.value })} /></label>
      <label>Maximum amount<input inputMode="decimal" value={params.max_amount} onChange={(event) => update({ max_amount: event.target.value })} /></label>
    </div></details>
    {loading ? <LoadingState message="Loading ledger..." /> : error ? <ErrorState message={error} onRetry={() => load()} /> : !data.items.length ? <EmptyState icon={<FaExchangeAlt />} message="No Transactions match these filters." /> : <>
      <div className="finance-table transaction-table"><div className="finance-row finance-head"><span>Transaction</span><span>Flow</span><span>Amount</span><span>Related</span><span>Status</span></div>{data.items.map((item) => <Link className="finance-row" to={`/admin/transactions/${item.transaction_id}`} key={item.transaction_id}><span><strong>{item.friendly_type}</strong><small>{item.transaction_id}</small><small>{new Date(item.created_at).toLocaleString()}</small></span><span><strong>{partyName(item.source)} to {partyName(item.destination)}</strong><small>{item.source.wallet_type || item.source.kind} to {item.destination.wallet_type || item.destination.kind}</small></span><span><strong>{money(item.amount, item.currency)}</strong><small>{item.payment_method || 'INTERNAL'}</small></span><span>{item.job ? <><strong>{item.job.display_title}</strong><small>Job {item.job.job_id}</small></> : <small>No Job</small>}</span><span><StatusBadge status={item.status} /></span></Link>)}</div>
      <div className="finance-pagination"><span>{data.pagination.total_items} Transactions</span><button disabled={data.pagination.page <= 1} onClick={() => update({ page: String(data.pagination.page - 1) })}>Previous</button><span>Page {data.pagination.page}/{data.pagination.total_pages || 1}</span><button disabled={data.pagination.page >= data.pagination.total_pages} onClick={() => update({ page: String(data.pagination.page + 1) })}>Next</button></div>
    </>}
  </div>;
};
export default AdminTransactionsPage;
