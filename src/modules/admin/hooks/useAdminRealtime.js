import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { acquireAuthenticatedSocket } from '../../chat/socket/chatSocket';

// Hook dùng để lắng nghe các sự kiện realtime liên quan đến trạng thái KYC, review và job trong trang admin.
const useAdminRealtime = (onQueueUpdated) => {
  const token = useSelector((state) => state.identity.token);
  const seenEvents = useRef(new Set());

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    let lease;
    let hasConnected = false;

    // Xử lý các sự kiện realtime từ server. Nếu sự kiện đã được xử lý trước đó (dựa trên event_id), nó sẽ bỏ qua.
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
    // Hàm xử lý khi socket kết nối thành công. Nếu đây là lần kết nối đầu tiên, nó sẽ không làm gì cả.
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
      // Lắng nghe các sự kiện realtime từ server và gọi các hàm xử lý tương ứng
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
