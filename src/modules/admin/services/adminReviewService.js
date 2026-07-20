import axios from '../../../core/api/axiosInstance';

const listAdminReviewCases = (params) => axios.get('/admin/reviews', { params });
const getAdminReviewCase = (caseType, caseId) => axios.get(`/admin/reviews/${caseType}/${caseId}`);
const getAdminReviewChat = (caseType, caseId, params) => axios.get(`/admin/reviews/${caseType}/${caseId}/chat`, { params });
const getAdminReviewEvidenceAccess = (caseType, caseId, evidenceId) => (
  axios.get(`/admin/reviews/${caseType}/${caseId}/evidence/${evidenceId}/access`)
);
const decideAdminReviewCase = (caseType, caseId, payload) => {
  const segment = {
    WARRANTY_CLAIM: 'warranty-claims',
    WARRANTY_REWORK: 'warranty-reworks',
    CANCELLATION: 'cancellations'
  }[caseType];
  return axios.post(`/admin/reviews/${segment}/${caseId}/decision`, payload);
};

export {
  decideAdminReviewCase,
  getAdminReviewCase,
  getAdminReviewChat,
  getAdminReviewEvidenceAccess,
  listAdminReviewCases
};
