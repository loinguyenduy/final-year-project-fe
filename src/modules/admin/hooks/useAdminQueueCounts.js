import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminQueueCounts } from '../services/adminQueueService';
import useAdminRealtime from './useAdminRealtime';

const useAdminQueueCounts = () => {
  const [counts, setCounts] = useState({
    kyc_pending: null,
    warranty_claim_pending: null,
    warranty_rework_review_required: null,
    cancellation_review_required: null,
    review_pending_total: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef(null);
  const lastCompletedAtRef = useRef(0);

  const refresh = useCallback(async () => {
    if (requestRef.current) return requestRef.current;
    if (Date.now() - lastCompletedAtRef.current < 500) return undefined;
    const request = (async () => {
      try {
        const response = await fetchAdminQueueCounts();
        if (response?.EC === 0) {
          setCounts(Object.fromEntries(Object.entries(response.DT || {}).map(([key, value]) => [key, Number(value) || 0])));
        }
      } finally {
        lastCompletedAtRef.current = Date.now();
        setIsLoading(false);
        requestRef.current = null;
      }
    })();
    requestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void refresh();
    const handleFocus = () => void refresh();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  useAdminRealtime(refresh);
  return { counts, isLoading, refresh };
};

export default useAdminQueueCounts;
