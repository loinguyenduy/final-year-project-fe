import axios from '../../../core/api/axiosInstance';

const withSignal = (signal) => (signal ? { signal } : undefined);

const getJobLifecycleDetails = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/accepted-details`, withSignal(signal))
);

const startMoving = (jobId, location = {}) => (
  axios.post(`/matchmaking/jobs/${jobId}/start-moving`, location)
);

const createArrivalRequest = (jobId, location = {}) => (
  axios.post(`/matchmaking/jobs/${jobId}/arrival-requests`, location)
);

const confirmArrival = (jobId, requestId) => (
  axios.post(`/matchmaking/jobs/${jobId}/arrival-requests/${requestId}/confirm`, {})
);

const rejectArrival = (jobId, requestId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/arrival-requests/${requestId}/reject`, payload)
);

const cancelAcceptedByCustomer = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/cancel-by-customer`, payload)
);

const cancelAcceptedByHandyman = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/cancel-by-handyman`, payload)
);

const createLifecycleCancellation = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/cancellations`, payload)
);

const confirmLifecycleCancellation = (jobId, cancellationId) => (
  axios.post(`/matchmaking/jobs/${jobId}/cancellations/${cancellationId}/confirm`, {})
);

const rejectLifecycleCancellation = (jobId, cancellationId, payload = {}) => (
  axios.post(`/matchmaking/jobs/${jobId}/cancellations/${cancellationId}/reject`, payload)
);

const getCurrentLifecycleCancellation = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/cancellations/current`, withSignal(signal))
);

const listBeforeEvidence = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/evidence/before`, withSignal(signal))
);

const uploadBeforeEvidence = (jobId, file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append('image', file);
  return axios.post(`/matchmaking/jobs/${jobId}/evidence/before`, formData, {
    onUploadProgress,
  });
};

const deleteBeforeEvidence = (jobId, evidenceId) => (
  axios.delete(`/matchmaking/jobs/${jobId}/evidence/before/${evidenceId}`)
);

const createQuoteDraft = (jobId) => (
  axios.post(`/matchmaking/jobs/${jobId}/quotes/draft`, {})
);

const getCurrentQuote = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/quotes/current`, withSignal(signal))
);

const updateQuoteDraft = (jobId, quoteId, payload) => (
  axios.put(`/matchmaking/jobs/${jobId}/quotes/${quoteId}`, payload)
);

const submitQuote = (jobId, quoteId) => (
  axios.post(`/matchmaking/jobs/${jobId}/quotes/${quoteId}/submit`, {})
);

const acceptQuote = (jobId, quoteId) => (
  axios.post(`/matchmaking/jobs/${jobId}/quotes/${quoteId}/accept`, {})
);

const rejectQuote = (jobId, quoteId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/quotes/${quoteId}/reject`, payload)
);

const getPaymentSummary = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/payment-summary`, withSignal(signal))
);

const payRemainingAmount = (jobId) => (
  axios.post(`/matchmaking/jobs/${jobId}/payments/remaining`, {})
);

const getContract = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/contract`, withSignal(signal))
);

export {
  acceptQuote,
  cancelAcceptedByCustomer,
  cancelAcceptedByHandyman,
  confirmArrival,
  confirmLifecycleCancellation,
  createArrivalRequest,
  createLifecycleCancellation,
  createQuoteDraft,
  deleteBeforeEvidence,
  getCurrentLifecycleCancellation,
  getCurrentQuote,
  getContract,
  getJobLifecycleDetails,
  getPaymentSummary,
  listBeforeEvidence,
  rejectArrival,
  rejectQuote,
  rejectLifecycleCancellation,
  startMoving,
  submitQuote,
  payRemainingAmount,
  updateQuoteDraft,
  uploadBeforeEvidence,
};
