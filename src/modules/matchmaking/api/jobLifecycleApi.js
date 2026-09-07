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

const WORK_EVIDENCE_PATHS = Object.freeze({
  DURING: 'during',
  AFTER: 'after',
  WARRANTY_CLAIM: 'warranty-claim',
  WARRANTY: 'warranty',
});

const getWorkEvidencePath = (stage) => {
  const path = WORK_EVIDENCE_PATHS[String(stage || '').toUpperCase()];
  if (!path) throw new Error(`Unsupported work evidence stage: ${stage}`);
  return path;
};

const listWorkEvidence = (jobId, stage, { signal } = {}) => (
  axios.get(
    `/matchmaking/jobs/${jobId}/evidence/${getWorkEvidencePath(stage)}`,
    withSignal(signal),
  )
);

const uploadWorkEvidence = (jobId, stage, file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append('image', file);
  return axios.post(
    `/matchmaking/jobs/${jobId}/evidence/${getWorkEvidencePath(stage)}`,
    formData,
    { onUploadProgress },
  );
};

const deleteWorkEvidence = (jobId, stage, evidenceId) => (
  axios.delete(
    `/matchmaking/jobs/${jobId}/evidence/${getWorkEvidencePath(stage)}/${evidenceId}`,
  )
);

const createCompletionRequest = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/completion-requests`, payload)
);

const listCompletionRequests = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/completion-requests`, withSignal(signal))
);

const getCompletionRequestEvidence = (jobId, requestId, { signal } = {}) => (
  axios.get(
    `/matchmaking/jobs/${jobId}/completion-requests/${requestId}/evidence`,
    withSignal(signal),
  )
);

const confirmCompletionRequest = (jobId, requestId) => (
  axios.post(`/matchmaking/jobs/${jobId}/completion-requests/${requestId}/confirm`, {})
);

const rejectCompletionRequest = (jobId, requestId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/completion-requests/${requestId}/reject`, payload)
);

const getWarranty = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/warranty`, withSignal(signal))
);

const createWarrantyClaim = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/warranty/claims`, payload)
);

const listWarrantyClaims = (jobId, { signal } = {}) => (
  axios.get(`/matchmaking/jobs/${jobId}/warranty/claims`, withSignal(signal))
);

const getWarrantyClaimEvidence = (jobId, claimId, { signal } = {}) => (
  axios.get(
    `/matchmaking/jobs/${jobId}/warranty/claims/${claimId}/evidence`,
    withSignal(signal),
  )
);

const createWarrantyCompletionRequest = (jobId, payload) => (
  axios.post(`/matchmaking/jobs/${jobId}/warranty/completion-requests`, payload)
);

const listWarrantyCompletionRequests = (jobId, { signal } = {}) => (
  axios.get(
    `/matchmaking/jobs/${jobId}/warranty/completion-requests`,
    withSignal(signal),
  )
);

const getWarrantyCompletionRequestEvidence = (
  jobId,
  requestId,
  { signal } = {},
) => (
  axios.get(
    `/matchmaking/jobs/${jobId}/warranty/completion-requests/${requestId}/evidence`,
    withSignal(signal),
  )
);

const confirmWarrantyCompletionRequest = (jobId, requestId) => (
  axios.post(
    `/matchmaking/jobs/${jobId}/warranty/completion-requests/${requestId}/confirm`,
    {},
  )
);

const rejectWarrantyCompletionRequest = (jobId, requestId, payload) => (
  axios.post(
    `/matchmaking/jobs/${jobId}/warranty/completion-requests/${requestId}/reject`,
    payload,
  )
);

export {
  acceptQuote,
  cancelAcceptedByCustomer,
  cancelAcceptedByHandyman,
  confirmArrival,
  confirmCompletionRequest,
  confirmLifecycleCancellation,
  confirmWarrantyCompletionRequest,
  createArrivalRequest,
  createCompletionRequest,
  createLifecycleCancellation,
  createQuoteDraft,
  createWarrantyClaim,
  createWarrantyCompletionRequest,
  deleteBeforeEvidence,
  deleteWorkEvidence,
  getCurrentLifecycleCancellation,
  getCurrentQuote,
  getContract,
  getCompletionRequestEvidence,
  getJobLifecycleDetails,
  getPaymentSummary,
  getWarranty,
  getWarrantyClaimEvidence,
  getWarrantyCompletionRequestEvidence,
  listBeforeEvidence,
  listCompletionRequests,
  listWarrantyClaims,
  listWarrantyCompletionRequests,
  listWorkEvidence,
  rejectArrival,
  rejectCompletionRequest,
  rejectQuote,
  rejectLifecycleCancellation,
  rejectWarrantyCompletionRequest,
  startMoving,
  submitQuote,
  payRemainingAmount,
  updateQuoteDraft,
  uploadBeforeEvidence,
  uploadWorkEvidence,
};
