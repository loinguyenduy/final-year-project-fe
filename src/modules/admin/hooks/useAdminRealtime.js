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

    const handleSignal = (payload = {}) => {
      const eventId = payload.event_id;
      if (eventId && seenEvents.current.has(eventId)) return;
      if (eventId) {
        seenEvents.current.add(eventId);
        if (seenEvents.current.size > 100) {
          seenEvents.current.delete(seenEvents.current.values().next().value);
        }
      }
      window.dispatchEvent(new CustomEvent('admin:kyc-queue-updated'));
      onQueueUpdated();
    };
    const handleConnect = () => {
      window.dispatchEvent(new CustomEvent('admin:kyc-queue-updated'));
      onQueueUpdated();
    };

    acquireAuthenticatedSocket(token).then((value) => {
      if (!active) {
        value.release();
        return;
      }
      lease = value;
      lease.socket.on('ADMIN_KYC_QUEUE_UPDATED', handleSignal);
      lease.socket.on('connect', handleConnect);
      if (!lease.socket.connected) lease.socket.connect();
    }).catch(() => {
      // Focus-based refetch remains the fallback when realtime is unavailable.
    });

    return () => {
      active = false;
      if (lease) {
        lease.socket.off('ADMIN_KYC_QUEUE_UPDATED', handleSignal);
        lease.socket.off('connect', handleConnect);
        lease.release();
      }
    };
  }, [onQueueUpdated, token]);
};

export default useAdminRealtime;
