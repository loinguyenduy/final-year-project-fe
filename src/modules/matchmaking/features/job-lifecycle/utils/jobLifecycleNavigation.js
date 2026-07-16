const LIFECYCLE_WORKSPACE_STATUSES = Object.freeze([
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'QUOTE_PENDING',
  'CANCELLATION_REVIEW',
]);

const normalizeRole = (role) => String(role || '').toUpperCase();
const isLifecycleWorkspaceStatus = (status) => (
  LIFECYCLE_WORKSPACE_STATUSES.includes(String(status || '').toUpperCase())
);

const getLifecycleWorkspacePath = (jobId) => `/jobs/${jobId}/lifecycle`;

const getLegacyJobDetailsPath = ({ jobId, role }) => (
  normalizeRole(role) === 'CUSTOMER'
    ? `/customer/my-jobs/${jobId}`
    : `/handyman/jobs/${jobId}`
);

const getJobDetailsPath = ({ jobId, status, role }) => (
  isLifecycleWorkspaceStatus(status)
    ? getLifecycleWorkspacePath(jobId)
    : getLegacyJobDetailsPath({ jobId, role })
);

const getLifecycleBackPath = (role) => (
  normalizeRole(role) === 'CUSTOMER' ? '/customer/my-jobs' : '/handyman/my-jobs'
);

export {
  LIFECYCLE_WORKSPACE_STATUSES,
  getJobDetailsPath,
  getLegacyJobDetailsPath,
  getLifecycleBackPath,
  getLifecycleWorkspacePath,
  isLifecycleWorkspaceStatus,
};
