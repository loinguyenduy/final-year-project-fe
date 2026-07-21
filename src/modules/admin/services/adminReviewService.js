import axios from '../../../core/api/axiosInstance';

// Compatibility-only read used by LegacyReviewRedirect. New UI reads cases from Admin Job detail.
const getAdminReviewCase = (caseType, caseId) => axios.get(`/admin/reviews/${caseType}/${caseId}`);
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
  getAdminReviewCase
};
