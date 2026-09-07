import { useEffect, useRef, useState } from 'react';
import {
  JOB_LIFECYCLE_SOCKET_EVENTS,
  acquireJobLifecycleSocket,
} from '../socket/jobLifecycleSocket';

const useJobLifecycleSocket = ({
  accessToken,
  acceptanceCycle,
  jobId,
  onEvent,
  onReconnect,
}) => {
  const [connectionState, setConnectionState] = useState('idle');
  const callbacksRef = useRef({ onEvent, onReconnect });
  const acceptanceCycleRef = useRef(acceptanceCycle);

  callbacksRef.current = { onEvent, onReconnect };
  acceptanceCycleRef.current = acceptanceCycle;

  useEffect(() => {
    if (!accessToken || !jobId) return undefined;

    let disposed = false;
    let socket = null;
    let socketHandle = null;
    let hasConnected = false;
    const eventHandlers = new Map();
    let connectionHandlers = null;

    const start = async () => {
      setConnectionState('connecting');
      socketHandle = await acquireJobLifecycleSocket(accessToken);
      socket = socketHandle.socket;
      if (disposed) {
        socketHandle.release();
        return;
      }

      const handleConnect = () => {
        if (disposed) return;
        setConnectionState('connected');
        if (hasConnected) callbacksRef.current.onReconnect?.();
        hasConnected = true;
      };
      const handleDisconnect = () => {
        if (!disposed) setConnectionState('disconnected');
      };
      const handleReconnectAttempt = () => {
        if (!disposed) setConnectionState('reconnecting');
      };
      const handleConnectError = () => {
        if (!disposed) setConnectionState('disconnected');
      };

      connectionHandlers = {
        handleConnect,
        handleConnectError,
        handleDisconnect,
        handleReconnectAttempt,
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.io.on('reconnect_attempt', handleReconnectAttempt);

      JOB_LIFECYCLE_SOCKET_EVENTS.forEach((eventName) => {
        const handler = (payload) => {
          if (disposed || payload?.job_id !== jobId) return;
          const currentCycle = Number(acceptanceCycleRef.current);
          const eventCycle = Number(payload?.acceptance_cycle);
          if (Number.isInteger(currentCycle)
            && (!Number.isInteger(eventCycle) || currentCycle !== eventCycle)) return;
          callbacksRef.current.onEvent?.(eventName, payload);
        };
        eventHandlers.set(eventName, handler);
        socket.on(eventName, handler);
      });

      if (socket.connected) handleConnect();
      else socket.connect();
    };

    void start().catch(() => {
      if (!disposed) setConnectionState('disconnected');
    });

    return () => {
      disposed = true;
      if (socket && connectionHandlers) {
        socket.off('connect', connectionHandlers.handleConnect);
        socket.off('disconnect', connectionHandlers.handleDisconnect);
        socket.off('connect_error', connectionHandlers.handleConnectError);
        socket.io.off('reconnect_attempt', connectionHandlers.handleReconnectAttempt);
      }
      if (socket) {
        eventHandlers.forEach((handler, eventName) => socket.off(eventName, handler));
      }
      socketHandle?.release();
    };
  }, [accessToken, jobId]);

  return connectionState;
};

export default useJobLifecycleSocket;
