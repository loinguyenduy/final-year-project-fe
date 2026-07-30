import { useCallback, useEffect, useRef, useState } from 'react';
import {
  abandonAiSession,
  createAiSession,
  getAiSession,
  sendAiMessage,
  submitAiDiagnosisDecision,
  submitAiPriceDecision,
} from '../services/aiJobAssistantService';
import {
  REVISION_ERROR_CODES,
  createStableUuid,
  getAiErrorCode,
  getAiErrorMessage,
  getAiCopy,
} from '../utils/aiJobAssistantPresentation';

const UI_LANGUAGE = 'EN';

const useAiJobAssistant = ({
  enabled,
  sessionId,
  onSessionIdChange,
}) => {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);
  const [pageError, setPageError] = useState('');
  const [composerError, setComposerError] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [diagnosisError, setDiagnosisError] = useState('');
  const mountedRef = useRef(true);
  const sessionRef = useRef(null);
  const readRequestRef = useRef(0);
  const readAbortRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => () => {
    mountedRef.current = false;
    readAbortRef.current?.abort();
  }, []);

  const commitSession = useCallback((nextSession) => {
    if (!mountedRef.current || !nextSession) return;
    sessionRef.current = nextSession;
    setSession(nextSession);
    setPageError('');
  }, []);

  const refreshSession = useCallback(async (targetSessionId = sessionRef.current?.session_id) => {
    if (!targetSessionId) return null;
    const requestId = ++readRequestRef.current;
    readAbortRef.current?.abort();
    const controller = new AbortController();
    readAbortRef.current = controller;
    try {
      const response = await getAiSession(targetSessionId, controller.signal);
      if (requestId !== readRequestRef.current) return null;
      commitSession(response?.DT);
      return response?.DT || null;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return null;
      if (requestId === readRequestRef.current && mountedRef.current) {
        setPageError(getAiErrorMessage(error, UI_LANGUAGE));
      }
      return null;
    }
  }, [commitSession]);

  const createSession = useCallback(async () => {
    const requestId = ++readRequestRef.current;
    readAbortRef.current?.abort();
    const controller = new AbortController();
    readAbortRef.current = controller;
    setLoadingSession(true);
    setPageError('');
    try {
      const response = await createAiSession(null, controller.signal);
      if (requestId !== readRequestRef.current) return null;
      const nextSession = response?.DT || null;
      commitSession(nextSession);
      if (nextSession?.session_id) onSessionIdChange(nextSession.session_id);
      return nextSession;
    } catch (error) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED' && mountedRef.current) {
        setPageError(getAiErrorMessage(error, UI_LANGUAGE));
      }
      return null;
    } finally {
      if (requestId === readRequestRef.current && mountedRef.current) setLoadingSession(false);
    }
  }, [commitSession, onSessionIdChange]);

  useEffect(() => {
    if (!enabled) {
      setLoadingSession(false);
      return;
    }
    if (sessionId && sessionRef.current?.session_id === sessionId) return;
    setLoadingSession(true);
    setPageError('');
    if (sessionId) {
      refreshSession(sessionId).finally(() => {
        if (mountedRef.current) setLoadingSession(false);
      });
    } else {
      createSession();
    }
  }, [createSession, enabled, refreshSession, sessionId]);

  const reconcileAfterError = useCallback(async (error, targetSessionId) => {
    const code = getAiErrorCode(error);
    if (REVISION_ERROR_CODES.has(code) || error?.DT?.session_id) {
      await refreshSession(targetSessionId);
    }
    return code;
  }, [refreshSession]);

  const sendMessage = useCallback(async ({
    message,
    clientMessageId = createStableUuid(),
  }) => {
    const current = sessionRef.current;
    if (!current || sendingMessage) return { ok: false, recorded: false };
    setSendingMessage(true);
    setComposerError('');
    try {
      const response = await sendAiMessage(current.session_id, {
        message,
        client_message_id: clientMessageId,
        expected_revision: current.revision,
      });
      commitSession(response?.DT);
      return { ok: true, recorded: true, clientMessageId };
    } catch (error) {
      await reconcileAfterError(error, current.session_id);
      if (mountedRef.current) {
        setComposerError(getAiErrorMessage(error, UI_LANGUAGE));
      }
      return {
        ok: false,
        recorded: Boolean(error?.DT?.client_message_id),
        clientMessageId,
      };
    } finally {
      if (mountedRef.current) setSendingMessage(false);
    }
  }, [commitSession, reconcileAfterError, sendingMessage]);

  const retryMessage = useCallback((message) => sendMessage({
    message: message.message,
    clientMessageId: message.client_message_id,
  }), [sendMessage]);

  const submitDiagnosisDecision = useCallback(async (action) => {
    const current = sessionRef.current;
    if (!current || submittingDiagnosis) return false;
    setSubmittingDiagnosis(true);
    setDiagnosisError('');
    try {
      const response = await submitAiDiagnosisDecision(current.session_id, {
        action,
        expected_revision: current.revision,
      });
      commitSession(response?.DT);
      return true;
    } catch (error) {
      await reconcileAfterError(error, current.session_id);
      if (mountedRef.current) {
        setDiagnosisError(getAiErrorMessage(
          error,
          UI_LANGUAGE,
        ));
      }
      return false;
    } finally {
      if (mountedRef.current) setSubmittingDiagnosis(false);
    }
  }, [commitSession, reconcileAfterError, submittingDiagnosis]);

  const submitDecision = useCallback(async ({
    action,
    clarification,
    budgetMin,
    budgetMax,
    clientMessageId,
  }) => {
    const current = sessionRef.current;
    if (!current || submittingDecision) return false;
    const payload = {
      action,
      expected_revision: current.revision,
    };
    if (action === 'RECALCULATE') {
      payload.clarification = clarification;
      payload.client_message_id = clientMessageId || createStableUuid();
    }
    if (action === 'USE_OWN_BUDGET') {
      payload.budget_min = budgetMin;
      payload.budget_max = budgetMax;
    }
    setSubmittingDecision(true);
    setDecisionError('');
    try {
      const response = await submitAiPriceDecision(current.session_id, payload);
      commitSession(response?.DT);
      return true;
    } catch (error) {
      await reconcileAfterError(error, current.session_id);
      if (mountedRef.current) {
        setDecisionError(getAiErrorMessage(error, UI_LANGUAGE));
      }
      return false;
    } finally {
      if (mountedRef.current) setSubmittingDecision(false);
    }
  }, [commitSession, reconcileAfterError, submittingDecision]);

  const abandonCurrent = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || ['ABANDONED', 'EXPIRED', 'APPLIED_TO_JOB'].includes(current.status)) {
      return true;
    }
    try {
      const response = await abandonAiSession(current.session_id, current.revision);
      commitSession(response?.DT);
      return true;
    } catch (error) {
      const code = getAiErrorCode(error);
      if (code === 'AI_SESSION_EXPIRED') return true;
      if (REVISION_ERROR_CODES.has(code)) {
        await refreshSession(current.session_id);
      }
      return false;
    }
  }, [commitSession, refreshSession]);

  const startOver = useCallback(async () => {
    const current = sessionRef.current;
    if (current && !await abandonCurrent()) {
      setPageError(getAiCopy(UI_LANGUAGE).sessionCloseFailed);
      return false;
    }
    sessionRef.current = null;
    setSession(null);
    setComposerError('');
    setDecisionError('');
    setDiagnosisError('');
    onSessionIdChange(null);
    const next = await createSession();
    return Boolean(next);
  }, [abandonCurrent, createSession, onSessionIdChange]);

  return {
    abandonCurrent,
    composerError,
    decisionError,
    diagnosisError,
    loadingSession,
    pageError,
    refreshSession,
    retryMessage,
    sendMessage,
    sendingMessage,
    session,
    startOver,
    submitDiagnosisDecision,
    submitDecision,
    submittingDiagnosis,
    submittingDecision,
  };
};

export default useAiJobAssistant;
