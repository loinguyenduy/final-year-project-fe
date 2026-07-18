import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaCommentDots } from 'react-icons/fa';
import useJobChat from '../hooks/useJobChat';
import { normalizeMessageContent } from '../utils/chatMessage';
import ChatDrawer from './ChatDrawer';
import '../styles/AcceptedJobChat.scss';

const AcceptedJobChat = ({ jobId, jobCode, partner, role, onRefreshJob }) => {
  const { account, token } = useSelector((state) => state.identity);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const launcherRef = useRef(null);
  const chat = useJobChat({
    jobId,
    currentUserId: account.id,
    accessToken: token,
    isOpen,
  });

  const openChat = useCallback(() => {
    setIsOpen(true);
    void chat.openConversation();
  }, [chat.openConversation]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const submitMessage = useCallback(async () => {
    if (isSubmitting) return false;
    const submittedDraft = draft;
    setIsSubmitting(true);
    const delivered = await chat.sendMessage(submittedDraft);
    setIsSubmitting(false);

    if (delivered) {
      setDraft((currentDraft) => (
        currentDraft === submittedDraft ? '' : currentDraft
      ));
    }
    return delivered;
  }, [chat.sendMessage, draft, isSubmitting]);

  const retryAccess = useCallback(async () => {
    await chat.openConversation();
  }, [chat.openConversation]);

  const clearMatchingDraft = useCallback((messageContent) => {
    setDraft((currentDraft) => (
      normalizeMessageContent(currentDraft).content === messageContent ? '' : currentDraft
    ));
  }, []);

  const retryMessage = useCallback(async (clientMessageId) => {
    const message = chat.messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    const delivered = await chat.retryMessage(clientMessageId);
    if (delivered && message) clearMatchingDraft(message.content);
  }, [chat.messages, chat.retryMessage, clearMatchingDraft]);

  const resendMessageAsNew = useCallback(async (clientMessageId) => {
    const message = chat.messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    const delivered = await chat.resendMessageAsNew(clientMessageId);
    if (delivered && message) clearMatchingDraft(message.content);
  }, [chat.messages, chat.resendMessageAsNew, clearMatchingDraft]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`accepted-chat-launcher accepted-chat-launcher--${role.toLowerCase()}`}
        onClick={openChat}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={chat.unreadCount > 0
          ? `Open chat. ${chat.unreadCount} unread messages.`
          : 'Open chat'}
      >
        <FaCommentDots aria-hidden="true" />
        <span>Message</span>
        {chat.unreadCount > 0 && (
          <span className="accepted-chat-launcher__badge" aria-hidden="true">
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <ChatDrawer
          chat={chat}
          currentUserId={account.id}
          draft={draft}
          isSubmitting={isSubmitting}
          jobCode={jobCode}
          onClose={closeChat}
          onDraftChange={setDraft}
          onRefreshJob={onRefreshJob}
          onResendAsNew={resendMessageAsNew}
          onRetryAccess={retryAccess}
          onRetryMessage={retryMessage}
          onSubmit={submitMessage}
          partner={chat.conversation?.partner || partner}
          role={role}
        />
      )}
    </>
  );
};

export default AcceptedJobChat;
