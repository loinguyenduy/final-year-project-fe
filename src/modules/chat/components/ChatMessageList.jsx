import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FaArrowRotateRight } from 'react-icons/fa6';
import { MESSAGE_BOTTOM_THRESHOLD_PX } from '../constants/chat.constants';
import ChatMessageBubble from './ChatMessageBubble';

const getDayKey = (message) => {
  const date = new Date(message.sent_at || message.local_sent_at);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDay = (message) => {
  const date = new Date(message.sent_at || message.local_sent_at);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date);
};

const isNearBottom = (element) => (
  element.scrollHeight - element.scrollTop - element.clientHeight <= MESSAGE_BOTTOM_THRESHOLD_PX
);

const ChatMessageList = ({
  currentUserId,
  hasMore,
  historyLoaded,
  historyLoading,
  messages,
  onLoadOlder,
  onResendAsNew,
  onRetryMessage,
  onViewportAtBottom,
  paginationError,
  paginationLoading,
  partner,
  readOnly = false,
}) => {
  const viewportRef = useRef(null);
  const paginationInFlightRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const previousLastMessageRef = useRef(null);

  const lastSeenOwnMessageId = useMemo(() => (
    [...messages].reverse().find(
      (message) => message.sender_id === currentUserId && message.is_seen,
    )?.id || null
  ), [currentUserId, messages]);

  const reportViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (viewport) onViewportAtBottom(isNearBottom(viewport));
  }, [onViewportAtBottom]);

  const loadOlder = useCallback(async () => {
    const viewport = viewportRef.current;
    if (!viewport || paginationInFlightRef.current || !hasMore) return;

    paginationInFlightRef.current = true;
    const previousHeight = viewport.scrollHeight;
    const previousTop = viewport.scrollTop;
    const loaded = await onLoadOlder();
    window.requestAnimationFrame(() => {
      if (loaded && viewportRef.current) {
        viewportRef.current.scrollTop = previousTop
          + viewportRef.current.scrollHeight
          - previousHeight;
      }
      paginationInFlightRef.current = false;
      reportViewport();
    });
  }, [hasMore, onLoadOlder, reportViewport]);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    reportViewport();
    if (viewport.scrollTop < 72 && hasMore && !paginationLoading && !paginationError) {
      void loadOlder();
    }
  }, [hasMore, loadOlder, paginationError, paginationLoading, reportViewport]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !historyLoaded) return;

    if (!didInitialScrollRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      didInitialScrollRef.current = true;
      window.requestAnimationFrame(reportViewport);
      return;
    }

    const latestMessage = messages.at(-1);
    const latestKey = latestMessage?.id || latestMessage?.client_message_id || null;
    const previousKey = previousLastMessageRef.current;
    const shouldFollow = isNearBottom(viewport)
      || (latestMessage?.sender_id === currentUserId && latestKey !== previousKey);
    if (shouldFollow) viewport.scrollTop = viewport.scrollHeight;
    previousLastMessageRef.current = latestKey;
    window.requestAnimationFrame(reportViewport);
  }, [currentUserId, historyLoaded, messages, reportViewport]);

  if (historyLoading && !historyLoaded) {
    return (
      <div className="accepted-chat__loading accepted-chat__loading--messages" role="status">
        <span className="accepted-chat__spinner" />
        <p>Loading messages…</p>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="accepted-chat__messages"
      onScroll={handleScroll}
      aria-live="polite"
      aria-label="Conversation messages"
    >
      <div className="accepted-chat__messages-inner">
        {paginationLoading && (
          <div className="accepted-chat__page-status" role="status">
            <span className="accepted-chat__spinner accepted-chat__spinner--small" />
            Loading earlier messages…
          </div>
        )}

        {paginationError && (
          <div className="accepted-chat__page-error" role="alert">
            <span>{paginationError}</span>
            <button type="button" onClick={() => void loadOlder()}>
              <FaArrowRotateRight /> Retry
            </button>
          </div>
        )}

        {!messages.length && historyLoaded && (
          <div className="accepted-chat__empty">
            <span>{readOnly ? 'No message history' : 'Start the conversation'}</span>
            <p>
              {readOnly
                ? 'No messages were exchanged before this conversation closed.'
                : `Send a message to coordinate this job with ${partner?.full_name || 'your partner'}.`}
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const showDay = !previousMessage || getDayKey(previousMessage) !== getDayKey(message);
          return (
            <React.Fragment key={message.id || `${message.sender_id}-${message.client_message_id}`}>
              {showDay && <div className="accepted-chat__day-divider"><span>{formatDay(message)}</span></div>}
              <ChatMessageBubble
                isLastSeen={message.id === lastSeenOwnMessageId}
                isOwn={message.sender_id === currentUserId}
                message={message}
                onResendAsNew={onResendAsNew}
                onRetry={onRetryMessage}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMessageList;
