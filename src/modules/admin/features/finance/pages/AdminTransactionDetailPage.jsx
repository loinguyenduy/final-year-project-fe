import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import { getAdminTransaction } from '../../../services/adminFinanceService';
import './AdminFinance.scss';

const money = (value, currency) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency || 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const AdminTransactionDetailPage = () => {
  const { transactionId } = useParams(); const navigate = useNavigate(); const [item, setItem] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async (signal) => { setLoading(true); try { setItem((await getAdminTransaction(transactionId, signal)).DT); } catch (requestError) { if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load Transaction.'); } finally { setLoading(false); } }, [transactionId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  if (loading) return <LoadingState message="Loading Transaction..." />; if (error) return <ErrorState message={error} onRetry={() => load()} />; if (!item) return null;
  const party = (value) => value.full_name || value.label;
  return <div className="transaction-detail"><button className="back-link" onClick={() => navigate('/admin/transactions')}>← Back to transactions</button><header><div><span className="eyebrow">{item.transaction_id}</span><h2>{item.friendly_type}</h2><p>{item.description || 'Canonical ledger entry'}</p></div><div><strong>{money(item.amount, item.currency)}</strong><StatusBadge status={item.status} /></div></header><section className="transaction-flow"><article><span>Source</span><strong>{party(item.source)}</strong><small>{item.source.wallet_type || item.source.kind}</small>{item.source.user_id && <Link to={`/admin/users/${item.source.user_id}`}>Open user</Link>}</article><b>→</b><article><span>Destination</span><strong>{party(item.destination)}</strong><small>{item.destination.wallet_type || item.destination.kind}</small>{item.destination.user_id && <Link to={`/admin/users/${item.destination.user_id}`}>Open user</Link>}</article></section><section><h3>Business context</h3><dl className="transaction-info"><div><dt>Type</dt><dd>{item.type}</dd></div><div><dt>Payment method</dt><dd>{item.payment_method || 'INTERNAL'}</dd></div><div><dt>Provider reference</dt><dd>{item.provider_reference || '—'}</dd></div><div><dt>Acceptance cycle</dt><dd>{item.acceptance_cycle || '—'}</dd></div><div><dt>Created</dt><dd>{new Date(item.created_at).toLocaleString()}</dd></div><div><dt>Last updated</dt><dd>{new Date(item.last_updated_at).toLocaleString()}</dd></div></dl><div className="detail-links">{item.job && <Link to={`/admin/jobs/${item.job.job_id}`}>Open related Job</Link>}{item.contract && <span>Contract {item.contract.contract_number || item.contract.contract_id}</span>}</div></section></div>;
};
export default AdminTransactionDetailPage;
