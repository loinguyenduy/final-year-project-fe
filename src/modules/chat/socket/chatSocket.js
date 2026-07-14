import axios from '../../../core/api/axiosInstance';
import { SOCKET_ACK_TIMEOUT_MS } from '../constants/chat.constants';

const resolveSocketServerUrl = () => {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL;
  if (configuredUrl) return configuredUrl;

  const apiBaseUrl = axios.defaults.baseURL || '/api/v1';
  return new URL(apiBaseUrl, window.location.origin).origin;
};

const createChatSocket = async (accessToken) => {
  const { io } = await import('socket.io-client');

  return io(resolveSocketServerUrl(), {
    auth: { token: accessToken },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: SOCKET_ACK_TIMEOUT_MS,
    transports: ['websocket'],
  });
};

const emitWithAcknowledgement = (
  socket,
  eventName,
  payload,
  timeoutMs = SOCKET_ACK_TIMEOUT_MS,
) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      const error = new Error('Socket is disconnected.');
      error.code = 'SOCKET_DISCONNECTED';
      reject(error);
      return;
    }

    socket.timeout(timeoutMs).emit(eventName, payload, (timeoutError, response) => {
      if (timeoutError) {
        const error = new Error('Socket acknowledgement timed out.');
        error.code = 'ACK_TIMEOUT';
        reject(error);
        return;
      }
      resolve(response);
    });
  });
};

export { createChatSocket, emitWithAcknowledgement, resolveSocketServerUrl };
