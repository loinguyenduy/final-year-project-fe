import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaRedoAlt, FaRobot, FaUser } from 'react-icons/fa';
import {
  getAiCopy,
  getSessionStateLabel,
} from '../utils/aiJobAssistantPresentation';

const MAX_MESSAGE_LENGTH = 2000;

const AiConversationPanel = ({
  session,
  sending,
  error,
  onSend,
  onRetry,
  onStartOver,
  language,
  focusComposerSignal,
}) => {
  const [composer, setComposer] = useState('');
  const messageRegionRef = useRef(null);
  const nearBottomRef = useRef(true);
  const composerRef = useRef(null);
  const messages = session?.messages || [];
  const canSend = session?.allowed_actions?.includes('SEND_MESSAGE') && !sending;
  const copy = getAiCopy(language);
  const correcting = session?.structured_draft?.diagnosis_confirmation === 'CORRECTING';

  useEffect(() => {
    const region = messageRegionRef.current;
    if (!region || !nearBottomRef.current) return;
    region.scrollTo({ top: region.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  useEffect(() => {
    if (!focusComposerSignal || !canSend) return;
    composerRef.current?.focus();
  }, [canSend, focusComposerSignal]);

  
  const submit = async () => {
    const message = composer.trim();
    if (!message || !canSend) return;
    // Gửi tin nhắn đến AI và nhận phản hồi
    const result = await onSend(message); //
    if (result?.ok || result?.recorded) setComposer('');
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void submit();
  };

  return (
    <section className="ai-conversation-card" aria-labelledby="ai-conversation-title">
      <header className="ai-conversation-card__header">
        <div className="ai-conversation-card__identity">
          <span className="ai-conversation-card__avatar" aria-hidden="true"><FaRobot /></span>
          <div>
            <h2 id="ai-conversation-title">{copy.aiAssistant}</h2>
            <span className="ai-session-state">{getSessionStateLabel(session, language)}</span>
          </div>
        </div>
        <button
          type="button"
          className="ai-text-action"
          onClick={onStartOver}
          disabled={sending}
        >
          <FaRedoAlt aria-hidden="true" /> {copy.startOver}
        </button>
      </header>

      <div
        ref={messageRegionRef}
        className="ai-message-region"
        role="log"
        aria-label={copy.conversationLabel}
        aria-live="polite"
        aria-relevant="additions"
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        }}
      >
        {messages.length === 0 && (
          <div className="ai-message ai-message--assistant">
            <span className="ai-message__icon" aria-hidden="true"><FaRobot /></span>
            <div className="ai-message__content">
              <span className="ai-message__sender">{copy.assistant}</span>
              <p>{copy.emptyPrompt}</p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const customer = message.sender === 'CUSTOMER';
          const failed = customer && message.delivery_status === 'FAILED';
          return (
            <article
              key={message.message_id || `${message.sender}-${message.sequence}`}
              className={`ai-message ai-message--${customer ? 'customer' : 'assistant'} ${failed ? 'ai-message--failed' : ''}`}
            >
              <span className="ai-message__icon" aria-hidden="true">
                {customer ? <FaUser /> : <FaRobot />}
              </span>
              <div className="ai-message__content">
                <span className="ai-message__sender">{customer ? copy.you : copy.assistant}</span>
                <p>{message.message}</p>
                {failed && (
                  <div className="ai-message__failure">
                    <span>{copy.failedMessage}</span>
                    <button type="button" onClick={() => onRetry(message)} disabled={sending}>
                      {copy.retry}
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {sending && (
          <div className="ai-message ai-message--assistant ai-message--processing" role="status" aria-live="polite">
            <span className="ai-message__icon" aria-hidden="true"><FaRobot /></span>
            <div className="ai-message__content">
              <span className="ai-message__sender">{copy.assistant}</span>
              <p><span className="ai-typing-dots" aria-hidden="true"><i /><i /><i /></span> {copy.analyzing}</p>
            </div>
          </div>
        )}
      </div>

      <div className="ai-composer">
        <label htmlFor="ai-assistant-message">{copy.composerLabel}</label>
        <div className="ai-composer__control">
          <textarea
            id="ai-assistant-message"
            ref={composerRef}
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            rows="2"
            placeholder={canSend
              ? (correcting ? copy.correctionPlaceholder : copy.composerPlaceholder)
              : copy.composerLocked}
            disabled={!canSend}
            aria-describedby={error ? 'ai-composer-error' : 'ai-composer-help'}
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSend || !composer.trim()}
            aria-label={copy.send}
          >
            <FaPaperPlane aria-hidden="true" />
            <span>{copy.send}</span>
          </button>
        </div>
        <div className="ai-composer__footer">
          {error
            ? <p id="ai-composer-error" className="ai-inline-error">{error}</p>
            : <p id="ai-composer-help">{correcting ? copy.correctionHelp : copy.composerHelp}</p>}
          <span className={composer.length > 1800 ? 'is-near-limit' : ''}>{composer.length}/{MAX_MESSAGE_LENGTH}</span>
        </div>
      </div>
    </section>
  );
};

export default AiConversationPanel;
