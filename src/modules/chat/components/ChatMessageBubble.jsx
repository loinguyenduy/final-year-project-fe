import React from 'react';
import { FaArrowRotateRight, FaCheck, FaCheckDouble } from 'react-icons/fa6';
import { MESSAGE_DELIVERY_STATES } from '../constants/chat.constants';

const formatMessageTime = (message) => {
  const value = message.sent_at || message.local_sent_at;
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const ChatMessageBubble = ({
  isLastSeen,
  isOwn,
  message,
  onResendAsNew,
  onRetry,
}) => {
  const failed = message.delivery_status === MESSAGE_DELIVERY_STATES.FAILED;
  const sending = message.delivery_status === MESSAGE_DELIVERY_STATES.SENDING;

  return (
    <article className={`accepted-chat-message ${isOwn ? 'accepted-chat-message--own' : ''}`}>
      <div className={`accepted-chat-message__bubble ${failed ? 'accepted-chat-message__bubble--failed' : ''}`}>
        <p>{message.content}</p>
        <div className="accepted-chat-message__meta">
          <time dateTime={message.sent_at || message.local_sent_at}>
            {formatMessageTime(message)}
          </time>
          {isOwn && sending && <span>Sending…</span>}
          {isOwn && !sending && !failed && (
            message.is_seen
              ? <FaCheckDouble aria-label="Seen" />
              : <FaCheck aria-label="Sent" />
          )}
        </div>
      </div>

      {isOwn && failed && (
        <div className="accepted-chat-message__failure" role="alert">
          <span>{message.delivery_error || 'Message not sent.'}</span>
          {message.retryable === false && onResendAsNew ? (
            <button type="button" onClick={() => onResendAsNew(message.client_message_id)}>
              Send as new
            </button>
          ) : message.retryable !== false && onRetry ? (
            <button type="button" onClick={() => onRetry(message.client_message_id)}>
              <FaArrowRotateRight /> Retry
            </button>
          ) : null}
        </div>
      )}

      {isOwn && isLastSeen && message.is_seen && !failed && (
        <span className="accepted-chat-message__seen">
          Seen{message.seen_at
            ? ` ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.seen_at))}`
            : ''}
        </span>
      )}
    </article>
  );
};

export default ChatMessageBubble;
