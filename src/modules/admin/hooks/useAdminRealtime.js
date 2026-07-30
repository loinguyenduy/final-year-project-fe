import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { acquireAuthenticatedSocket } from '../../chat/socket/chatSocket';

const useAdminRealtime = (onQueueUpdated) => {
  const token = useSelector((state) => state.identity.token);
  const seenEvents = useRef(new Set());

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    let lease;
    let hasConnected = false;

    const handleSignal = (eventName, { refreshQueue = true } = {}) => (payload = {}) => {
      const eventId = payload.event_id;
      if (eventId && seenEvents.current.has(eventId)) return;
      if (eventId) {
        seenEvents.current.add(eventId);
        if (seenEvents.current.size > 100) {
          seenEvents.current.delete(seenEvents.current.values().next().value);
        }
      }
      window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
      if (refreshQueue) onQueueUpdated();
    };
    const handleKycSignal = handleSignal('admin:kyc-queue-updated');
    const handleReviewSignal = handleSignal('admin:review-queue-updated');
    const handleJobSignal = handleSignal('admin:job-updated', { refreshQueue: false });
    const handleConnect = () => {
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      window.dispatchEvent(new CustomEvent('admin:kyc-queue-updated'));
      window.dispatchEvent(new CustomEvent('admin:review-queue-updated'));
      window.dispatchEvent(new CustomEvent('admin:job-updated'));
      onQueueUpdated();
    };

    acquireAuthenticatedSocket(token).then((value) => {
      if (!active) {
        value.release();
        return;
      }
      lease = value;
      hasConnected = lease.socket.connected;
      lease.socket.on('ADMIN_KYC_QUEUE_UPDATED', handleKycSignal);
      lease.socket.on('ADMIN_REVIEW_QUEUE_UPDATED', handleReviewSignal);
      lease.socket.on('ADMIN_JOB_UPDATED', handleJobSignal);
      lease.socket.on('connect', handleConnect);
      if (!lease.socket.connected) lease.socket.connect();
    }).catch(() => {
      // Focus-based refetch remains the fallback when realtime is unavailable.
    });

    return () => {
      active = false;
      if (lease) {
        lease.socket.off('ADMIN_KYC_QUEUE_UPDATED', handleKycSignal);
        lease.socket.off('ADMIN_REVIEW_QUEUE_UPDATED', handleReviewSignal);
        lease.socket.off('ADMIN_JOB_UPDATED', handleJobSignal);
        lease.socket.off('connect', handleConnect);
        lease.release();
      }
    };
  }, [onQueueUpdated, token]);
};

export default useAdminRealtime;
