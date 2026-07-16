import { acquireAuthenticatedSocket } from '../../../../chat/socket/chatSocket';

const JOB_LIFECYCLE_SOCKET_EVENTS = Object.freeze([
  'JOB_EN_ROUTE',
  'JOB_ARRIVAL_REQUESTED',
  'JOB_ARRIVAL_REJECTED',
  'JOB_ARRIVED',
  'JOB_QUOTE_SUBMITTED',
  'JOB_CANCELLATION_REQUESTED',
  'JOB_CANCELLATION_REVIEW_REQUIRED',
  'JOB_CANCELLATION_REJECTED',
  'JOB_CANCELLED',
]);

const acquireJobLifecycleSocket = (accessToken) => acquireAuthenticatedSocket(accessToken);

export { JOB_LIFECYCLE_SOCKET_EVENTS, acquireJobLifecycleSocket };
