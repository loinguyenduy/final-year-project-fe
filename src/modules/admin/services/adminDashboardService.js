import axios from '../../../core/api/axiosInstance';

const getAdminDashboard = (period, signal) => axios.get('/admin/dashboard', { params: { period }, signal });

export { getAdminDashboard };
