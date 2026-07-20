import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { PageHeader } from '../../../components/AdminStates';
import { fetchKycRequestDetail, fetchKycRequests } from '../../../services/adminKycService';
import KycDecisionModal from '../components/KycDecisionModal';
import KycRequestDetail from '../components/KycRequestDetail';
import KycRequestList from '../components/KycRequestList';
import '../styles/KycManagement.scss';

const KycManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext() || {};
  const refreshQueueCounts = outletContext.refreshQueueCounts || (() => Promise.resolve());
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size')) || 20));
  const status = searchParams.get('status') || 'PENDING';
  const role = searchParams.get('role') || 'ALL';
  const selectedId = searchParams.get('submission') || '';
  const querySearch = searchParams.get('search') || '';
  const [searchText, setSearchText] = useState(querySearch);
  const [listState, setListState] = useState({ items: [], pagination: null, queryKey: '', initialLoading: true, refreshing: false, error: '' });
  const [detailState, setDetailState] = useState({ data: null, initialLoading: false, refreshing: false, error: '' });
  const [decision, setDecision] = useState(null);
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const listPromiseRef = useRef(null);
  const detailPromiseRef = useRef(null);
  const signalTimerRef = useRef(null);
  const mutationRefreshUntilRef = useRef(0);

  const updateQuery = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadList = useCallback(async () => {
    const requestKey = [page, pageSize, status, role, querySearch].join('|');
    if (listPromiseRef.current?.key === requestKey) return listPromiseRef.current.promise;
    const requestId = ++listRequestRef.current;
    setListState((current) => {
      const hasCurrentData = current.queryKey === requestKey;
      return {
        ...current,
        items: hasCurrentData ? current.items : [],
        pagination: hasCurrentData ? current.pagination : null,
        queryKey: requestKey,
        initialLoading: !hasCurrentData,
        refreshing: hasCurrentData,
        error: ''
      };
    });
    const promise = (async () => {
      try {
        const response = await fetchKycRequests({ page, page_size: pageSize, status, role, search: querySearch });
        if (requestId !== listRequestRef.current) return;
        setListState({ items: response.DT.items, pagination: response.DT.pagination, queryKey: requestKey, initialLoading: false, refreshing: false, error: '' });
      } catch (error) {
        if (requestId !== listRequestRef.current) return;
        setListState((current) => ({ ...current, initialLoading: false, refreshing: false, error: error?.EM || 'Unable to load KYC requests.' }));
      } finally {
        if (listPromiseRef.current?.promise === promise) listPromiseRef.current = null;
      }
    })();
    listPromiseRef.current = { key: requestKey, promise };
    return promise;
  }, [page, pageSize, querySearch, role, status]);

  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      detailRequestRef.current += 1;
      setDetailState({ data: null, initialLoading: false, refreshing: false, error: '' });
      return;
    }
    if (detailPromiseRef.current?.key === selectedId) return detailPromiseRef.current.promise;
    const requestId = ++detailRequestRef.current;
    setDetailState((current) => ({
      ...current,
      data: current.data?.id === selectedId ? current.data : null,
      initialLoading: current.data?.id !== selectedId,
      refreshing: current.data?.id === selectedId,
      error: ''
    }));
    const promise = (async () => {
      try {
        const response = await fetchKycRequestDetail(selectedId);
        if (requestId !== detailRequestRef.current) return;
        setDetailState({ data: response.DT, initialLoading: false, refreshing: false, error: '' });
      } catch (error) {
        if (requestId !== detailRequestRef.current) return;
        setDetailState((current) => ({ ...current, initialLoading: false, refreshing: false, error: error?.EM || 'Unable to load this KYC request.' }));
      } finally {
        if (detailPromiseRef.current?.promise === promise) detailPromiseRef.current = null;
      }
    })();
    detailPromiseRef.current = { key: selectedId, promise };
    return promise;
  }, [selectedId]);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => { void loadDetail(); }, [loadDetail]);
  useEffect(() => { setSearchText(querySearch); }, [querySearch]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchText !== querySearch) updateQuery({ search: searchText.trim(), page: 1, submission: '' });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [querySearch, searchText, updateQuery]);
  useEffect(() => {
    const refresh = () => { void loadList(); void loadDetail(); };
    const refreshFromSignal = () => {
      if (Date.now() < mutationRefreshUntilRef.current) return;
      if (signalTimerRef.current) window.clearTimeout(signalTimerRef.current);
      signalTimerRef.current = window.setTimeout(() => {
        if (Date.now() >= mutationRefreshUntilRef.current) refresh();
      }, 150);
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('admin:kyc-queue-updated', refreshFromSignal);
    return () => {
      if (signalTimerRef.current) window.clearTimeout(signalTimerRef.current);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('admin:kyc-queue-updated', refreshFromSignal);
    };
  }, [loadDetail, loadList]);

  const selectedSummary = useMemo(
    () => listState.items.find((item) => item.id === selectedId),
    [listState.items, selectedId]
  );
  const selectRequest = (id) => updateQuery({ submission: id });
  const changeFilter = (key, value) => updateQuery({ [key]: value, page: 1, submission: '' });
  const refreshAll = async () => {
    await Promise.all([loadList(), loadDetail(), refreshQueueCounts()]);
  };

  const handleDecisionSuccess = async (response) => {
    setDecision(null);
    mutationRefreshUntilRef.current = Date.now() + 1200;
    toast.success(response?.EM || 'KYC request updated.');
    await refreshAll();
  };
  const handleDecisionError = async (error) => {
    if (['KYC_REQUEST_ALREADY_REVIEWED', 'SOURCE_STATE_CHANGED'].includes(error?.code)) {
      setDecision(null);
      mutationRefreshUntilRef.current = Date.now() + 1200;
      toast.info('This request was already changed. The latest information has been loaded.');
      await refreshAll();
      return;
    }
    toast.error(error?.EM || 'Unable to update the KYC request.');
  };

  return (
    <div className={`kyc-management-page ${selectedId ? 'has-selection' : ''}`}>
      <PageHeader
        title="KYC Approval Center"
        description="Review participant identity submissions through a protected document viewer."
        aside={<span className="canonical-count">{outletContext.queueCounts?.kyc_pending ?? '—'} pending</span>}
      />

      <div className="kyc-toolbar">
        <label className="search-control">
          <FaSearch />
          <span className="visually-hidden">Search by name or email</span>
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search name or email" />
        </label>
        <select aria-label="Filter by participant role" value={role} onChange={(event) => changeFilter('role', event.target.value)}>
          <option value="ALL">All roles</option><option value="HANDYMAN">Handymen</option><option value="CUSTOMER">Customers</option>
        </select>
        <select aria-label="Filter by KYC status" value={status} onChange={(event) => changeFilter('status', event.target.value)}>
          <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All statuses</option>
        </select>
      </div>

      <div className="kyc-container">
        <KycRequestList
          state={listState}
          selectedId={selectedId}
          page={page}
          onSelect={selectRequest}
          onPageChange={(nextPage) => updateQuery({ page: nextPage, submission: '' })}
          onRetry={loadList}
        />
        <KycRequestDetail
          selectedId={selectedId}
          state={detailState}
          onBack={() => updateQuery({ submission: '' })}
          onRetry={loadDetail}
          onSelectHistory={selectRequest}
          onDecision={setDecision}
        />
      </div>

      <KycDecisionModal
        key={`${decision}-${detailState.data?.id || selectedSummary?.id || ''}`}
        decision={decision}
        submission={detailState.data}
        onClose={() => setDecision(null)}
        onSuccess={handleDecisionSuccess}
        onError={handleDecisionError}
      />
    </div>
  );
};

export default KycManagementPage;
