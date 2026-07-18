import axios from '../../../core/api/axiosInstance';
import { SOCKET_ACK_TIMEOUT_MS } from '../constants/chat.constants';

const socketEntries = new Map();

const resolveSocketServerUrl = () => {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL;
  if (configuredUrl) return configuredUrl;

  const apiBaseUrl = axios.defaults.baseURL || '/api/v1';
  return new URL(apiBaseUrl, window.location.origin).origin;
};

const createSocketEntry = (accessToken) => {
  const entry = {
    accessToken,
    references: 0,
    socket: null,
    promise: null,
  };

  entry.promise = import('socket.io-client')
    .then(({ io }) => {
      entry.socket = io(resolveSocketServerUrl(), {
        auth: { token: accessToken },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: SOCKET_ACK_TIMEOUT_MS,
        transports: ['websocket'],
      });
      return entry.socket;
    })
    .catch((error) => {
      if (socketEntries.get(accessToken) === entry) socketEntries.delete(accessToken);
      throw error;
    });

  socketEntries.set(accessToken, entry);
  return entry;
};

const acquireAuthenticatedSocket = async (accessToken) => {
  if (!accessToken) throw new Error('An access token is required for realtime features.');

  const entry = socketEntries.get(accessToken) || createSocketEntry(accessToken);
  entry.references += 1;

  let socket;
  try {
    socket = entry.socket || await entry.promise;
  } catch (error) {
    entry.references = Math.max(0, entry.references - 1);
    throw error;
  }

  let released = false;
  return {
    socket,
    release: () => {
      if (released) return;
      released = true;
      entry.references = Math.max(0, entry.references - 1);
      if (entry.references > 0) return;

      if (socketEntries.get(accessToken) === entry) socketEntries.delete(accessToken);
      entry.socket?.disconnect();
    },
  };
};

const acquireChatSocket = (accessToken) => acquireAuthenticatedSocket(accessToken);

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

export {
  acquireAuthenticatedSocket,
  acquireChatSocket,
  emitWithAcknowledgement,
  resolveSocketServerUrl,
};
