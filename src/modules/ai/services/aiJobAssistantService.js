import axios from '../../../core/api/axiosInstance';

const BASE_PATH = '/ai/job-assistant';

const createAiSession = (initialMessage, signal) => axios.post(
  `${BASE_PATH}/sessions`,
  initialMessage ? { initial_message: initialMessage } : {},
  { signal },
);

const getAiSession = (sessionId, signal) => axios.get(
  `${BASE_PATH}/sessions/${sessionId}`,
  { signal },
);

const sendAiMessage = (sessionId, payload) => axios.post(
  `${BASE_PATH}/sessions/${sessionId}/messages`,
  payload,
);

const submitAiDiagnosisDecision = (sessionId, payload) => axios.post(
  `${BASE_PATH}/sessions/${sessionId}/diagnosis-decision`,
  payload,
);

const submitAiPriceDecision = (sessionId, payload) => axios.post(
  `${BASE_PATH}/sessions/${sessionId}/price-decision`,
  payload,
);

const abandonAiSession = (sessionId, expectedRevision) => axios.post(
  `${BASE_PATH}/sessions/${sessionId}/abandon`,
  { expected_revision: expectedRevision },
);

export {
  abandonAiSession,
  createAiSession,
  getAiSession,
  sendAiMessage,
  submitAiDiagnosisDecision,
  submitAiPriceDecision,
};
