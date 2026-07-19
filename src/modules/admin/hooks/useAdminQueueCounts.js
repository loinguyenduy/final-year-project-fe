import { useCallback, useEffect, useState } from 'react';
import { fetchAdminQueueCounts } from '../services/adminQueueService';
import useAdminRealtime from './useAdminRealtime';

const useAdminQueueCounts = () => {
  const [counts, setCounts] = useState({ kyc_pending: null });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetchAdminQueueCounts();
      if (response?.EC === 0) setCounts({ kyc_pending: Number(response.DT?.kyc_pending) || 0 });
    } finally {
      setIsLoading(false);
    }
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
