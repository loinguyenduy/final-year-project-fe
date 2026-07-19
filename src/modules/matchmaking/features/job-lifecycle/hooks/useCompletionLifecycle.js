import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  confirmCompletionRequest,
  createCompletionRequest,
  getCompletionRequestEvidence,
  listCompletionRequests,
  rejectCompletionRequest,
} from '../../../api/jobLifecycleApi';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const useCompletionLifecycle = ({ enabled, jobId, onCanonicalRefresh, refreshKey }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mutation, setMutation] = useState(null);
  const [evidenceByRequest, setEvidenceByRequest] = useState({});
  const [evidenceLoadingId, setEvidenceLoadingId] = useState(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const mutationRef = useRef(null);

  const refreshRequests = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !jobId) return null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const response = await listCompletionRequests(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) setRequests(response.DT?.requests || []);
      return response;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setLoadError(getFriendlyLifecycleError(error, 'Completion history could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [enabled, jobId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void refreshRequests();
    else {
      controllerRef.current?.abort();
      setRequests([]);
      setEvidenceByRequest({});
    }
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [enabled, refreshKey, refreshRequests]);

  const runMutation = useCallback(async (key, action, successCopy) => {
    if (mutationRef.current) return null;
    mutationRef.current = key;
    setMutation(key);
    try {
      const response = await action();
      if (response?.EC !== 0) throw response;
      toast.success(successCopy);
      await Promise.all([
        refreshRequests({ silent: true }),
        onCanonicalRefresh?.({ silent: true }),
      ]);
      return response;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error));
      if (Number(error?.response?.status) === 409 || Number(error?.EC) === 409) {
        await Promise.all([
          refreshRequests({ silent: true }),
          onCanonicalRefresh?.({ silent: true }),
        ]);
      }
      return null;
    } finally {
      mutationRef.current = null;
      if (mountedRef.current) setMutation(null);
    }
  }, [onCanonicalRefresh, refreshRequests]);

  const loadRequestEvidence = useCallback(async (requestId) => {
    if (!requestId || evidenceByRequest[requestId]) return evidenceByRequest[requestId] || [];
    setEvidenceLoadingId(requestId);
    try {
      const response = await getCompletionRequestEvidence(jobId, requestId);
      if (response?.EC !== 0) throw response;
      const evidence = response.DT?.evidence || [];
      if (mountedRef.current) {
        setEvidenceByRequest((current) => ({ ...current, [requestId]: evidence }));
      }
      return evidence;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'Request evidence could not be loaded.'));
      return [];
    } finally {
      if (mountedRef.current) setEvidenceLoadingId(null);
    }
  }, [evidenceByRequest, jobId]);

  return {
    confirm: (requestId) => runMutation(
      'confirm',
      () => confirmCompletionRequest(jobId, requestId),
      'Work completion confirmed. Warranty has started.',
    ),
    create: (payload) => runMutation(
      'create',
      () => createCompletionRequest(jobId, payload),
      'Completion request sent to the customer.',
    ),
    evidenceByRequest,
    evidenceLoadingId,
    loadError,
    loadRequestEvidence,
    loading,
    mutation,
    refreshRequests,
    reject: (requestId, payload) => runMutation(
      'reject',
      () => rejectCompletionRequest(jobId, requestId, payload),
      'Completion request rejected.',
    ),
    requests,
  };
};

export default useCompletionLifecycle;
