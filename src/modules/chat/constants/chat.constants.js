const CHAT_EVENTS = Object.freeze({
  JOIN: 'conversation:join',
  LEAVE: 'conversation:leave',
  SEND_MESSAGE: 'message:send',
  READ: 'conversation:read',
  NEW_MESSAGE: 'message:new',
  READ_UPDATED: 'conversation:read_updated',
  CLOSED: 'conversation:closed',
  ERROR: 'chat:error',
});

const CHAT_ACCESS_STATES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CLOSED: 'closed',
  UNAVAILABLE: 'unavailable',
});

const CHAT_CONNECTION_STATES = Object.freeze({
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
});

const MESSAGE_DELIVERY_STATES = Object.freeze({
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
});

const CLOSED_REASON_COPY = Object.freeze({
  CUSTOMER_REOPEN_BIDDING: 'The customer chose to find another handyman.',
  CUSTOMER_CANCELLED_JOB: 'The customer cancelled this job.',
  HANDYMAN_CANCELLED: 'The handyman can no longer continue this job.',
  JOB_CANCELLED: 'This job has been cancelled.',
  JOB_CLOSED: 'This job has been completed and the conversation is now closed.',
  JOB_RETURNED_TO_BIDDING: 'This job returned to the bidding stage.',
  ACCEPTANCE_CYCLE_SUPERSEDED: 'A newer handyman assignment replaced this conversation.',
});

const CHAT_ERROR_COPY = Object.freeze({
  PARTICIPANT_INACTIVE: 'Chat is temporarily unavailable because one participant is inactive.',
  CONVERSATION_CLOSED: 'This conversation is no longer available.',
  CHAT_NOT_ALLOWED_FOR_JOB_STATUS: 'Chat is not available for the current job status.',
  ACCEPTANCE_CYCLE_INCONSISTENT: 'This job assignment is not ready for chat yet.',
  ACCEPTED_DATA_INCONSISTENT: 'The accepted job data could not be verified for chat.',
  CONVERSATION_NOT_FOUND: 'The conversation could not be found.',
  SOCKET_NOT_JOINED: 'Reconnecting to the conversation…',
  CLIENT_MESSAGE_ID_CONFLICT: 'This message could not be retried safely. Please send it again.',
  RATE_LIMITED: 'You are sending messages too quickly. Please wait a moment.',
  INVALID_CURSOR: 'Older messages could not be loaded. Please try again.',
  MESSAGE_TOO_LONG: 'Messages can contain up to 2,000 characters.',
  INVALID_MESSAGE_CONTENT: 'Enter a message before sending.',
  ACK_TIMEOUT: 'Delivery could not be confirmed. Retry when your connection is stable.',
  SOCKET_DISCONNECTED: 'You are offline. Reconnect before retrying this message.',
});

const MESSAGE_PAGE_SIZE = 30;
const MESSAGE_MAX_LENGTH = 2000;
const SOCKET_ACK_TIMEOUT_MS = 8000;
const MESSAGE_BOTTOM_THRESHOLD_PX = 96;

export {
  CHAT_ACCESS_STATES,
  CHAT_CONNECTION_STATES,
  CHAT_ERROR_COPY,
  CHAT_EVENTS,
  CLOSED_REASON_COPY,
  MESSAGE_BOTTOM_THRESHOLD_PX,
  MESSAGE_DELIVERY_STATES,
  MESSAGE_MAX_LENGTH,
  MESSAGE_PAGE_SIZE,
  SOCKET_ACK_TIMEOUT_MS,
};
