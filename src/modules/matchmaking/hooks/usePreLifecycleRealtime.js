import { useEffect, useRef } from 'react';
import { acquireAuthenticatedSocket } from '../../chat/socket/chatSocket';

const PRE_LIFECYCLE_EVENTS = Object.freeze([
  'JOB_BID_SUBMITTED',
  'JOB_BID_UPDATED',
  'JOB_BID_WITHDRAWN',
  'JOB_ACCEPTED',
  'JOB_CANCELLED',
  'JOB_REVIEW_SUBMITTED',
]);

const usePreLifecycleRealtime = ({ accessToken, jobId = null, onInvalidate }) => {
  const callbackRef = useRef(onInvalidate);
  callbackRef.current = onInvalidate;

  useEffect(() => {
    if (!accessToken) return undefined;
    let disposed = false;
    let handle = null;
    let socket = null;
    let timer = null;
    let latestEvent = null;
    const handlers = new Map();

    const scheduleInvalidate = (eventName, payload) => {
      latestEvent = { eventName, payload };
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = null;
        const event = latestEvent;
        latestEvent = null;
        callbackRef.current?.(event);
      }, 120);
    };

    const start = async () => {
      handle = await acquireAuthenticatedSocket(accessToken);
      socket = handle.socket;
      if (disposed) {
        handle.release();
        return;
      }
      PRE_LIFECYCLE_EVENTS.forEach((eventName) => {
        const handler = (payload) => {
          if (disposed || (jobId && payload?.job_id !== jobId)) return;
          scheduleInvalidate(eventName, payload);
        };
        handlers.set(eventName, handler);
        socket.on(eventName, handler);
      });
      const reconnectHandler = () => scheduleInvalidate('RECONNECT', null);
      handlers.set('connect', reconnectHandler);
      socket.on('connect', reconnectHandler);
      if (!socket.connected) socket.connect();
    };

    void start().catch(() => {
      // HTTP remains canonical when realtime is temporarily unavailable.
    });
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      if (socket) {
        PRE_LIFECYCLE_EVENTS.forEach((eventName) => {
          const handler = handlers.get(eventName);
          if (handler) socket.off(eventName, handler);
        });
        const reconnectHandler = handlers.get('connect');
        if (reconnectHandler) socket.off('connect', reconnectHandler);
      }
      handle?.release();
    };
  }, [accessToken, jobId]);
};

export { PRE_LIFECYCLE_EVENTS };
export default usePreLifecycleRealtime;
