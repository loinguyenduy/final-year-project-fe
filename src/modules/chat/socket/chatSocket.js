import { SOCKET_ACK_TIMEOUT_MS } from '../constants/chat.constants';
import { SOCKET_SERVER_URL } from '../../../core/config/runtimeUrls';

const socketEntries = new Map();

const resolveSocketServerUrl = () => {
  return SOCKET_SERVER_URL;
};

/*
Tạo một entry socket mới cho accessToken được cung cấp. Entry này bao gồm:
- accessToken: token truy cập được sử dụng để xác thực kết nối socket.
- references: số lượng tham chiếu hiện tại đến entry này.
- socket: đối tượng socket.io-client được tạo ra.
- promise: một Promise đại diện cho quá trình tạo socket.
*/
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
        reconnectionAttempts: Infinity, // tiếp tục thử connect
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

/*
Hàm để lấy một socket đã xác thực dựa trên accessToken. 
Nếu socket chưa tồn tại, nó sẽ được tạo ra. Hàm trả về một đối tượng chứa socket và một hàm release để giảm 
số lượng tham chiếu và ngắt kết nối nếu không còn tham chiếu nào.
Nếu có sockets đã được tạo ra cho accessToken này, nó sẽ tăng số lượng reference và trả về socket hiện tại.
*/
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

const disconnectAllAuthenticatedSockets = () => {
  socketEntries.forEach((entry) => entry.socket?.disconnect());
  socketEntries.clear();
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

export {
  acquireAuthenticatedSocket,
  acquireChatSocket,
  disconnectAllAuthenticatedSockets,
  emitWithAcknowledgement,
  resolveSocketServerUrl,
};
