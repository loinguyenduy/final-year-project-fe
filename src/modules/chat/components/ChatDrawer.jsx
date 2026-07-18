import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaArrowRotateRight,
  FaCircleExclamation,
  FaLock,
  FaXmark,
} from 'react-icons/fa6';
import {
  CHAT_ACCESS_STATES,
  CHAT_CONNECTION_STATES,
  CLOSED_REASON_COPY,
} from '../constants/chat.constants';
import ChatComposer from './ChatComposer';
import ChatMessageList from './ChatMessageList';

const getConnectionCopy = (connectionState, joined) => {
  if (connectionState === CHAT_CONNECTION_STATES.CONNECTED && joined) return 'Chat connected';
  if (connectionState === CHAT_CONNECTION_STATES.RECONNECTING) return 'Chat reconnecting…';
  if (connectionState === CHAT_CONNECTION_STATES.CONNECTING) return 'Chat connecting…';
  if (connectionState === CHAT_CONNECTION_STATES.DISCONNECTED) return 'Chat offline';
  return 'Preparing chat…';
};

const PartnerAvatar = ({ partner }) => {
  if (partner?.avatar_url) {
    return <img className="accepted-chat__avatar" src={partner.avatar_url} alt="" />;
  }

  return (
    <span className="accepted-chat__avatar accepted-chat__avatar--placeholder" aria-hidden="true">
      {partner?.full_name?.trim()?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
};

const AccessNotice = ({ accessState, details, onRefreshJob, onRetryAccess }) => {
  if (accessState === CHAT_ACCESS_STATES.INACTIVE) {
    return (
      <div className="accepted-chat__state-card" role="status">
        <span className="accepted-chat__state-icon"><FaLock /></span>
        <h3>Chat is temporarily locked</h3>
        <p>{details?.message || 'One participant is currently inactive. No messages are shown or sent while access is locked.'}</p>
        <button type="button" onClick={onRetryAccess}>
          <FaArrowRotateRight /> Retry
        </button>
      </div>
    );
  }

  if (accessState === CHAT_ACCESS_STATES.CLOSED) {
    const reasonCopy = CLOSED_REASON_COPY[details?.reason]
      || details?.message
      || 'This conversation is no longer available.';
    return (
      <div className="accepted-chat__state-card" role="status">
        <span className="accepted-chat__state-icon"><FaLock /></span>
        <h3>Conversation closed</h3>
        <p>{reasonCopy}</p>
        {details?.closed_at && (
          <small>Closed {new Date(details.closed_at).toLocaleString('en-US')}</small>
        )}
        <button type="button" onClick={onRefreshJob}>
          <FaArrowRotateRight /> Refresh job
        </button>
      </div>
    );
  }

  return (
    <div className="accepted-chat__state-card" role="status">
      <span className="accepted-chat__state-icon"><FaCircleExclamation /></span>
      <h3>Chat is unavailable</h3>
      <p>{details?.message || 'The current job assignment is not available for chat.'}</p>
      <button type="button" onClick={onRefreshJob}>
        <FaArrowRotateRight /> Refresh job
      </button>
    </div>
  );
};

const ChatDrawer = ({
  chat,
  currentUserId,
  draft,
  isSubmitting,
  jobCode,
  onClose,
  onDraftChange,
  onRefreshJob,
  onResendAsNew,
  onRetryAccess,
  onRetryMessage,
  onSubmit,
  partner,
  role,
}) => {
  const closeButtonRef = useRef(null);
  const isActive = chat.accessState === CHAT_ACCESS_STATES.ACTIVE;
  const connectionCopy = getConnectionCopy(chat.connectionState, chat.joined);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const updateBodyLock = () => {
      document.body.style.overflow = media.matches ? 'hidden' : '';
    };
    updateBodyLock();
    media.addEventListener('change', updateBodyLock);
    return () => {
      media.removeEventListener('change', updateBodyLock);
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div
      className={`accepted-chat accepted-chat--${role.toLowerCase()}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="accepted-chat__drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${partner?.full_name || 'job partner'}`}
      >
        <header className="accepted-chat__header">
          <PartnerAvatar partner={partner} />
          <div className="accepted-chat__heading">
            <strong>{partner?.full_name || 'Job partner'}</strong>
            <div>
              <span>{jobCode}</span>
              <span aria-hidden="true">·</span>
              <span className={`accepted-chat__connection accepted-chat__connection--${chat.connectionState}`}>
                {connectionCopy}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="accepted-chat__close"
            onClick={onClose}
            aria-label="Close chat"
          >
            <FaXmark />
          </button>
        </header>

        {chat.generalError && isActive && chat.conversation && (
          <div className="accepted-chat__error" role="alert">
            <FaCircleExclamation />
            <span>{chat.generalError}</span>
            <button
              type="button"
              className="accepted-chat__error-retry"
              onClick={() => void chat.openConversation()}
            >
              Retry
            </button>
            <button type="button" onClick={chat.clearGeneralError} aria-label="Dismiss error">
              <FaXmark />
            </button>
          </div>
        )}

        {!isActive ? (
          <AccessNotice
            accessState={chat.accessState}
            details={chat.accessDetails}
            onRefreshJob={onRefreshJob}
            onRetryAccess={onRetryAccess}
          />
        ) : !chat.opening && !chat.conversation && chat.generalError ? (
          <div className="accepted-chat__state-card" role="alert">
            <span className="accepted-chat__state-icon"><FaCircleExclamation /></span>
            <h3>Could not open chat</h3>
            <p>{chat.generalError}</p>
            <button type="button" onClick={onRetryAccess}>
              <FaArrowRotateRight /> Retry
            </button>
          </div>
        ) : chat.opening || !chat.conversation ? (
          <div className="accepted-chat__loading" role="status">
            <span className="accepted-chat__spinner" />
            <p>Opening your conversation…</p>
          </div>
        ) : (
          <>
            <ChatMessageList
              currentUserId={currentUserId}
              hasMore={chat.hasMore}
              historyLoaded={chat.historyLoaded}
              historyLoading={chat.historyLoading}
              messages={chat.messages}
              onLoadOlder={chat.loadOlderMessages}
              onResendAsNew={onResendAsNew}
              onRetryMessage={onRetryMessage}
              onViewportAtBottom={chat.setViewportAtBottom}
              paginationError={chat.paginationError}
              paginationLoading={chat.paginationLoading}
              partner={partner}
            />
            <ChatComposer
              canSend={chat.canSend && !isSubmitting}
              cooldownRemainingMs={chat.cooldownRemainingMs}
              draft={draft}
              error={chat.composerError}
              isSubmitting={isSubmitting}
              onChange={(value) => {
                onDraftChange(value);
                chat.clearComposerError();
              }}
              onSubmit={onSubmit}
            />
          </>
        )}
      </section>
    </div>,
    document.body,
  );
};

export default ChatDrawer;
