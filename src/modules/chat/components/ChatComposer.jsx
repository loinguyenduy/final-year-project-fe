import React, { useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { getMessageCharacterCount, normalizeMessageContent } from '../utils/chatMessage';
import { MESSAGE_MAX_LENGTH } from '../constants/chat.constants';

const ChatComposer = ({
  canSend,
  cooldownRemainingMs,
  draft,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}) => {
  const textareaRef = useRef(null);
  const characterCount = getMessageCharacterCount(draft);
  const overLimit = characterCount > MESSAGE_MAX_LENGTH;
  const hasValidContent = !normalizeMessageContent(draft).error;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [draft]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend && hasValidContent) void onSubmit();
    }
  };

  const cooldownSeconds = Math.max(1, Math.ceil(cooldownRemainingMs / 1000));

  return (
    <footer className="accepted-chat-composer">
      {(error || cooldownRemainingMs > 0) && (
        <div className="accepted-chat-composer__error" role="alert">
          {cooldownRemainingMs > 0
            ? `Please wait ${cooldownSeconds}s before sending again.`
            : error}
        </div>
      )}
      <div className={`accepted-chat-composer__field ${overLimit ? 'accepted-chat-composer__field--invalid' : ''}`}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Write a message…"
          aria-label="Message"
          aria-describedby="accepted-chat-character-count"
        />
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSend || !hasValidContent}
          aria-label={isSubmitting ? 'Sending message' : 'Send message'}
        >
          <FaPaperPlane />
        </button>
      </div>
      <div className="accepted-chat-composer__hint">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span
          id="accepted-chat-character-count"
          className={characterCount > 1800 ? 'accepted-chat-composer__count--warning' : ''}
        >
          {characterCount.toLocaleString('en-US')} / {MESSAGE_MAX_LENGTH.toLocaleString('en-US')}
        </span>
      </div>
    </footer>
  );
};

export default ChatComposer;
