import axios from '../../../core/api/axiosInstance';

const fetchAdminQueueCounts = () => axios.get('/admin/queue-counts');

export { fetchAdminQueueCounts };
