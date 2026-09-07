import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaCommentDots } from 'react-icons/fa';
import useJobChat from '../hooks/useJobChat';
import { normalizeMessageContent } from '../utils/chatMessage';
import ChatDrawer from './ChatDrawer';
import '../styles/AcceptedJobChat.scss';

const AcceptedJobChat = ({ jobId, jobCode, jobStatus, partner, role, onRefreshJob }) => {
  const { account, token } = useSelector((state) => state.identity);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const launcherRef = useRef(null);
  const chat = useJobChat({
    jobId,
    currentUserId: account.id,
    accessToken: token,
    historyOnlyExpected: jobStatus === 'CLOSED',
    isOpen,
  });
  const {
    messages,
    openConversation,
    resendMessageAsNew: resendChatMessageAsNew,
    retryMessage: retryChatMessage,
    sendMessage,
  } = chat;

  const openChat = useCallback(() => {
    setIsOpen(true);
    void openConversation();
  }, [openConversation]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const submitMessage = useCallback(async () => {
    if (isSubmitting) return false;
    const submittedDraft = draft;
    setIsSubmitting(true);
    const delivered = await sendMessage(submittedDraft);
    setIsSubmitting(false);

    if (delivered) {
      setDraft((currentDraft) => (
        currentDraft === submittedDraft ? '' : currentDraft
      ));
    }
    return delivered;
  }, [draft, isSubmitting, sendMessage]);

  const retryAccess = useCallback(async () => {
    await openConversation();
  }, [openConversation]);

  const clearMatchingDraft = useCallback((messageContent) => {
    setDraft((currentDraft) => (
      normalizeMessageContent(currentDraft).content === messageContent ? '' : currentDraft
    ));
  }, []);

  const retryMessage = useCallback(async (clientMessageId) => {
    const message = messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    const delivered = await retryChatMessage(clientMessageId);
    if (delivered && message) clearMatchingDraft(message.content);
  }, [clearMatchingDraft, messages, retryChatMessage]);

  const resendMessageAsNew = useCallback(async (clientMessageId) => {
    const message = messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    const delivered = await resendChatMessageAsNew(clientMessageId);
    if (delivered && message) clearMatchingDraft(message.content);
  }, [clearMatchingDraft, messages, resendChatMessageAsNew]);

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
          : jobStatus === 'CLOSED' ? 'Open chat history' : 'Open chat'}
      >
        <FaCommentDots aria-hidden="true" />
        <span>{jobStatus === 'CLOSED' ? 'History' : 'Message'}</span>
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
