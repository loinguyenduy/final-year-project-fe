import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaClipboardList, FaRobot } from 'react-icons/fa';
import CustomerCreateJobPage from '../../customer/features/jobs/pages/CustomerCreateJobPage';
import AiConversationPanel from '../components/AiConversationPanel';
import AiJobDraftPanel from '../components/AiJobDraftPanel';
import useAiJobAssistant from '../hooks/useAiJobAssistant';
import { getAiCopy } from '../utils/aiJobAssistantPresentation';
import '../styles/AiJobAssistant.scss';

const UI_LANGUAGE = 'EN';

const AiJobAssistantPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'manual' ? 'manual' : 'ai';
  const sessionId = searchParams.get('session') || null;
  const [aiDetached, setAiDetached] = useState(false);
  const [focusComposerSignal, setFocusComposerSignal] = useState(0);

  const updateSessionId = useCallback((nextSessionId) => {
    // Cập nhật sessionId trong URL
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextSessionId) next.set('session', nextSessionId);
      else next.delete('session');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const assistant = useAiJobAssistant({
    // Kích hoạt AI session if mode là 'ai' hoặc nếu có sessionId trong URL
    enabled: mode === 'ai' || Boolean(sessionId),
    sessionId,
    onSessionIdChange: updateSessionId,
  });
  const copy = getAiCopy(UI_LANGUAGE); 

  // Cập nhật mode trong URL
  const setMode = (nextMode) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextMode === 'manual') next.set('mode', 'manual');
      else next.delete('mode');
      return next;
    }, { replace: true });
  };

  // Xử lý khi người dùng muốn bắt đầu lại cuộc trò chuyện với AI
  const handleStartOver = async () => {
    const hasConversation = Boolean(assistant.session?.messages?.length);
    if (hasConversation && !window.confirm(copy.startOverConfirm)) {
      return;
    }
    setAiDetached(false);
    await assistant.startOver();
  };

  // Xử lý khi người dùng muốn tiếp tục với form thủ công sau khi AI đã đưa ra đề xuất
  const handleContinue = () => {
    setAiDetached(false);
    setMode('manual');
  };

  // Xử lý khi người dùng đưa ra quyết định về chẩn đoán từ AI
  const handleDiagnosisAction = async (action) => {
    const saved = await assistant.submitDiagnosisDecision(action);
    if (saved && action === 'CORRECT_DIAGNOSIS') {
      setFocusComposerSignal((current) => current + 1);
    }
    return saved;
  };

  // Xử lý khi người dùng muốn tách cuộc trò chuyện AI ra khỏi form
  const handleDetachAi = () => {
    setAiDetached(true);
    void assistant.abandonCurrent();
    updateSessionId(null);
  };

  // Xác định session AI hiện tại nếu nó ở trạng thái "DRAFT_READY"
  const readySession = assistant.session?.status === 'DRAFT_READY'
    ? assistant.session
    : null;
  const aiDraft = useMemo(
    () => readySession?.form_draft || null,
    [readySession],
  );
  const linkedSessionId = !aiDetached && readySession ? readySession.session_id : null;

  const send = (message) => assistant.sendMessage({ message });

  return (
    <main className="ai-assistant-page">
      <header className="ai-assistant-page__header">
        <div>
          <span className="ai-assistant-page__eyebrow"><FaRobot aria-hidden="true" /> AI Job Assistant</span>
          <h1>{copy.pageTitle}</h1>
          <p>{copy.pageSubtitle}</p>
        </div>
        <span className="ai-assistant-page__badge">{copy.textAssistant}</span>
      </header>

      <div className="ai-mode-bar">
        <div className="ai-mode-switch" role="tablist" aria-label={copy.pageTitle}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ai'}
            className={mode === 'ai' ? 'is-active' : ''}
            onClick={() => setMode('ai')}
          >
            <FaRobot aria-hidden="true" /> {copy.aiAssistant}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            className={mode === 'manual' ? 'is-active' : ''}
            onClick={() => setMode('manual')}
          >
            <FaClipboardList aria-hidden="true" /> {copy.manualForm}
          </button>
        </div>
        {mode === 'ai' && (
          <button type="button" className="ai-text-action" onClick={() => setMode('manual')}>
            {copy.skipAi}
          </button>
        )}
      </div>

      <div hidden={mode !== 'ai'}>
        <>
          {assistant.loadingSession && !assistant.session && (
            <div className="ai-page-state" role="status">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              {copy.preparing}
            </div>
          )}

          {assistant.pageError && !assistant.session && (
            <section className="ai-page-state ai-page-state--error" role="alert">
              <h2>{copy.unavailableTitle}</h2>
              <p>{assistant.pageError}</p>
              <div>
                <button type="button" className="ai-button ai-button--primary" onClick={handleStartOver}>{copy.tryAgain}</button>
                <button type="button" className="ai-button ai-button--secondary" onClick={() => setMode('manual')}>{copy.useManual}</button>
              </div>
            </section>
          )}

          {assistant.session && (
            <div className="ai-assistant-grid">
              <AiConversationPanel
                session={assistant.session}
                sending={assistant.sendingMessage}
                error={assistant.composerError}
                onSend={send}
                onRetry={assistant.retryMessage}
                onStartOver={handleStartOver}
                language={UI_LANGUAGE}
                focusComposerSignal={focusComposerSignal}
              />
              <AiJobDraftPanel
                session={assistant.session}
                decisionError={assistant.decisionError}
                diagnosisError={assistant.diagnosisError}
                language={UI_LANGUAGE}
                submittingDiagnosis={assistant.submittingDiagnosis}
                submittingDecision={assistant.submittingDecision}
                onDiagnosisAction={handleDiagnosisAction}
                onDecision={assistant.submitDecision}
                onContinue={handleContinue}
              />
            </div>
          )}
        </>
      </div>

      <section
        className="ai-manual-mode"
        aria-labelledby="manual-job-form-title"
        hidden={mode !== 'manual'}
      >
          <div className="ai-manual-mode__intro">
            <div>
              <span className="ai-assistant-page__eyebrow"><FaClipboardList aria-hidden="true" /> {copy.manualForm}</span>
              <h2 id="manual-job-form-title">{copy.manualTitle}</h2>
              <p>
                {linkedSessionId
                  ? copy.manualPrefilled
                  : copy.manualDescription}
              </p>
            </div>
            {sessionId && (
              <button type="button" className="ai-text-action" onClick={() => setMode('ai')}>
                {copy.returnToAi}
              </button>
            )}
          </div>
          <CustomerCreateJobPage
            embedded
            initialAiDraft={aiDraft}
            aiSessionId={linkedSessionId}
            onAiSessionDetached={handleDetachAi}
            onJobCreated={(jobId) => {
              setAiDetached(true);
              if (jobId) navigate(`/customer/my-jobs/${jobId}`, { replace: true });
            }}
          />
      </section>
    </main>
  );
};

export default AiJobAssistantPage;
