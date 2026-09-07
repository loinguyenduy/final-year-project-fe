import axios from '../../../core/api/axiosInstance';

const listAdminJobs = (params, signal) => axios.get('/admin/jobs', { params, signal });
const getAdminJob = (jobId, signal) => axios.get(`/admin/jobs/${jobId}`, { signal });
const listAdminJobBids = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/bids`, { params, signal });
const listAdminJobCycles = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/cycles`, { params, signal });
const getAdminJobCycle = (jobId, cycle, signal) => axios.get(`/admin/jobs/${jobId}/cycles/${cycle}`, { signal });
const listAdminJobEvidence = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/evidence`, { params, signal });
const listAdminJobTimeline = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/timeline`, { params, signal });
const listAdminJobAudits = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/audits`, { params, signal });
const getAdminJobChat = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/chat`, { params, signal });
const listAdminJobTransactions = (jobId, params, signal) => axios.get(`/admin/jobs/${jobId}/transactions`, { params, signal });
const getAdminJobEvidenceAccess = (jobId, evidenceId) => axios.get(`/admin/jobs/${jobId}/evidence/${evidenceId}/access`);
const getAdminJobImageAccess = (jobId, imageKey) => axios.get(`/admin/jobs/${jobId}/images/${imageKey}/access`);

export {
  getAdminJob,
  getAdminJobChat,
  getAdminJobCycle,
  getAdminJobEvidenceAccess,
  getAdminJobImageAccess,
  listAdminJobAudits,
  listAdminJobBids,
  listAdminJobCycles,
  listAdminJobEvidence,
  listAdminJobTimeline,
  listAdminJobTransactions,
  listAdminJobs
};
