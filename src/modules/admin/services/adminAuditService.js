import axios from '../../../core/api/axiosInstance';

const getAdminAuditLogs = (params, signal) => axios.get('/admin/audit-logs', { params, signal });
const getAdminAuditFilterOptions = (signal) => axios.get('/admin/audit-logs/filter-options', { signal });
const getAdminAuditLog = (auditId, signal) => axios.get(`/admin/audit-logs/${auditId}`, { signal });

export { getAdminAuditFilterOptions, getAdminAuditLog, getAdminAuditLogs };
