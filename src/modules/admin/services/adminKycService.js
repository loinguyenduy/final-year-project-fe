import axios from '../../../core/api/axiosInstance';

const fetchKycRequests = (params) => axios.get('/admin/kyc/requests', { params });
const fetchKycRequestDetail = (submissionId) => axios.get(`/admin/kyc/requests/${submissionId}`);
const fetchKycDocumentAccess = (submissionId, documentId) => (
  axios.get(`/admin/kyc/requests/${submissionId}/documents/${documentId}/access`)
);
const decideKycRequest = (submissionId, payload) => (
  axios.post(`/admin/kyc/requests/${submissionId}/decision`, payload)
);

export {
  decideKycRequest,
  fetchKycDocumentAccess,
  fetchKycRequestDetail,
  fetchKycRequests
};
