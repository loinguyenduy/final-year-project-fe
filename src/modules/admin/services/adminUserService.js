import axios from '../../../core/api/axiosInstance';

const getAdminUsers = (params, signal) => axios.get('/admin/users', { params, signal });
const getAdminUser = (userId, signal) => axios.get(`/admin/users/${userId}`, { signal });
const getAdminUserJobs = (userId, params, signal) => axios.get(`/admin/users/${userId}/jobs`, { params, signal });
const deactivateAdminUser = (userId, payload) => axios.post(`/admin/users/${userId}/deactivate`, payload);
const reactivateAdminUser = (userId, payload) => axios.post(`/admin/users/${userId}/reactivate`, payload);

export { deactivateAdminUser, getAdminUser, getAdminUserJobs, getAdminUsers, reactivateAdminUser };
