import {
  CHAT_ERROR_COPY,
  MESSAGE_DELIVERY_STATES,
  MESSAGE_MAX_LENGTH,
} from '../constants/chat.constants';

const normalizeContentValue = (content) => String(content ?? '')
  .replace(/\r\n?/g, '\n')
  .normalize('NFC')
  .trim();

const normalizeMessageContent = (content) => {
  const normalized = normalizeContentValue(content);
  const length = Array.from(normalized).length;

  if (!normalized) {
    return {
      content: '',
      length: 0,
      error: CHAT_ERROR_COPY.INVALID_MESSAGE_CONTENT,
      code: 'INVALID_MESSAGE_CONTENT',
    };
  }
  if (length > MESSAGE_MAX_LENGTH) {
    return {
      content: normalized,
      length,
      error: CHAT_ERROR_COPY.MESSAGE_TOO_LONG,
      code: 'MESSAGE_TOO_LONG',
    };
  }

  return { content: normalized, length, error: null, code: null };
};

const getMessageCharacterCount = (content) => Array.from(normalizeContentValue(content)).length;

const createClientMessageId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const getMessageTime = (message) => {
  const value = message.sent_at || message.local_sent_at;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const compareMessagePosition = (left, right) => {
  const timeDifference = getMessageTime(left) - getMessageTime(right);
  if (timeDifference !== 0) return timeDifference;

  const leftId = String(left.id || left.client_message_id || '');
  const rightId = String(right.id || right.client_message_id || '');
  if (leftId === rightId) return 0;
  return leftId < rightId ? -1 : 1;
};

const isSameLogicalMessage = (left, right) => {
  if (left.id && right.id && left.id === right.id) return true;
  return Boolean(
    left.client_message_id
      && right.client_message_id
      && left.client_message_id === right.client_message_id
      && left.sender_id === right.sender_id,
  );
};

const toConfirmedMessage = (message) => ({
  ...message,
  delivery_status: MESSAGE_DELIVERY_STATES.SENT,
  delivery_error: null,
});

const mergeMessages = (currentMessages, incomingMessages) => {
  const next = [...currentMessages];

  incomingMessages.forEach((incomingMessage) => {
    const normalizedIncoming = incomingMessage.id
      ? toConfirmedMessage(incomingMessage)
      : incomingMessage;
    const existingIndex = next.findIndex((message) => (
      isSameLogicalMessage(message, normalizedIncoming)
    ));

    if (existingIndex === -1) {
      next.push(normalizedIncoming);
      return;
    }

    const existing = next[existingIndex];
    if (existing.id && !normalizedIncoming.id) return;
    next[existingIndex] = { ...existing, ...normalizedIncoming };
  });

  return next.sort(compareMessagePosition);
};

const updateMessageByClientId = (messages, clientMessageId, updates) => {
  return messages.map((message) => (
    message.client_message_id === clientMessageId
      ? { ...message, ...updates }
      : message
  ));
};

const getErrorEnvelope = (error) => {
  if (error?.code && error?.EC !== undefined) return error;
  if (error?.response?.data) return error.response.data;
  if (error?.code) {
    return {
      EM: error.message,
      EC: 0,
      code: error.code,
      DT: '',
    };
  }
  return {
    EM: error?.EM || error?.message || 'Chat is temporarily unavailable.',
    EC: error?.EC || 500,
    code: error?.code || 'INTERNAL_SERVER_ERROR',
    DT: error?.DT || '',
  };
};

const getFriendlyChatError = (error) => {
  const envelope = getErrorEnvelope(error);
  return CHAT_ERROR_COPY[envelope.code] || envelope.EM || 'Chat is temporarily unavailable.';
};

export {
  compareMessagePosition,
  createClientMessageId,
  getErrorEnvelope,
  getFriendlyChatError,
  getMessageCharacterCount,
  isSameLogicalMessage,
  mergeMessages,
  normalizeMessageContent,
  toConfirmedMessage,
  updateMessageByClientId,
};
