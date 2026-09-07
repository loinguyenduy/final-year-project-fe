import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  confirmWarrantyCompletionRequest,
  createWarrantyClaim,
  createWarrantyCompletionRequest,
  getWarrantyClaimEvidence,
  getWarrantyCompletionRequestEvidence,
  listWarrantyClaims,
  listWarrantyCompletionRequests,
  rejectWarrantyCompletionRequest,
} from '../../../api/jobLifecycleApi';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const useWarrantyLifecycle = ({ enabled, jobId, onCanonicalRefresh, refreshKey }) => {
  const [claims, setClaims] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mutation, setMutation] = useState(null);
  const [claimEvidence, setClaimEvidence] = useState({});
  const [requestEvidence, setRequestEvidence] = useState({});
  const [evidenceLoadingKey, setEvidenceLoadingKey] = useState(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const mutationRef = useRef(null);

  const refreshHistory = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !jobId) return null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const [claimResponse, requestResponse] = await Promise.all([
        listWarrantyClaims(jobId, { signal: controller.signal }),
        listWarrantyCompletionRequests(jobId, { signal: controller.signal }),
      ]);
      if (claimResponse?.EC !== 0) throw claimResponse;
      if (requestResponse?.EC !== 0) throw requestResponse;
      if (mountedRef.current) {
        setClaims(claimResponse.DT?.claims || []);
        setRequests(requestResponse.DT?.requests || []);
      }
      return { claims: claimResponse, requests: requestResponse };
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setLoadError(getFriendlyLifecycleError(error, 'Warranty history could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [enabled, jobId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void refreshHistory();
    else {
      controllerRef.current?.abort();
      setClaims([]);
      setRequests([]);
      setClaimEvidence({});
      setRequestEvidence({});
    }
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [enabled, refreshHistory, refreshKey]);

  const runMutation = useCallback(async (key, action, successCopy) => {
    if (mutationRef.current) return null;
    mutationRef.current = key;
    setMutation(key);
    try {
      const response = await action();
      if (response?.EC !== 0) throw response;
      toast.success(successCopy);
      await Promise.all([
        refreshHistory({ silent: true }),
        onCanonicalRefresh?.({ silent: true }),
      ]);
      return response;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error));
      if (Number(error?.response?.status) === 409 || Number(error?.EC) === 409) {
        await Promise.all([
          refreshHistory({ silent: true }),
          onCanonicalRefresh?.({ silent: true }),
        ]);
      }
      return null;
    } finally {
      mutationRef.current = null;
      if (mountedRef.current) setMutation(null);
    }
  }, [onCanonicalRefresh, refreshHistory]);

  const loadClaimEvidence = useCallback(async (claimId) => {
    if (!claimId || claimEvidence[claimId]) return claimEvidence[claimId] || [];
    const key = `claim:${claimId}`;
    setEvidenceLoadingKey(key);
    try {
      const response = await getWarrantyClaimEvidence(jobId, claimId);
      if (response?.EC !== 0) throw response;
      const evidence = response.DT?.evidence || [];
      if (mountedRef.current) setClaimEvidence((current) => ({ ...current, [claimId]: evidence }));
      return evidence;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'Claim evidence could not be loaded.'));
      return [];
    } finally {
      if (mountedRef.current) setEvidenceLoadingKey(null);
    }
  }, [claimEvidence, jobId]);

  const loadRequestEvidence = useCallback(async (requestId) => {
    if (!requestId || requestEvidence[requestId]) return requestEvidence[requestId] || [];
    const key = `request:${requestId}`;
    setEvidenceLoadingKey(key);
    try {
      const response = await getWarrantyCompletionRequestEvidence(jobId, requestId);
      if (response?.EC !== 0) throw response;
      const evidence = response.DT?.evidence || [];
      if (mountedRef.current) setRequestEvidence((current) => ({ ...current, [requestId]: evidence }));
      return evidence;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'Rework evidence could not be loaded.'));
      return [];
    } finally {
      if (mountedRef.current) setEvidenceLoadingKey(null);
    }
  }, [jobId, requestEvidence]);

  return {
    claimEvidence,
    claims,
    confirmRework: (requestId) => runMutation(
      'confirm-rework',
      () => confirmWarrantyCompletionRequest(jobId, requestId),
      'Warranty rework confirmed.',
    ),
    createClaim: (payload) => runMutation(
      'create-claim',
      () => createWarrantyClaim(jobId, payload),
      'Warranty claim submitted for review.',
    ),
    createReworkRequest: (payload) => runMutation(
      'create-rework-request',
      () => createWarrantyCompletionRequest(jobId, payload),
      'Warranty completion request sent.',
    ),
    evidenceLoadingKey,
    loadClaimEvidence,
    loadError,
    loading,
    loadRequestEvidence,
    mutation,
    refreshHistory,
    rejectRework: (requestId, payload) => runMutation(
      'reject-rework',
      () => rejectWarrantyCompletionRequest(jobId, requestId, payload),
      'Warranty rework rejected.',
    ),
    requestEvidence,
    requests,
  };
};

export default useWarrantyLifecycle;
