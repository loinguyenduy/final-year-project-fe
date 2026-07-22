import axios from '../../../core/api/axiosInstance';

const getCustomerOverviewApi = () => axios.get('/identity/customer/overview');
const getHandymanOverviewApi = () => axios.get('/identity/handyman/overview');
const getPublicProfileApi = (userId) => axios.get(`/identity/users/${userId}/public-profile`);
const getPublicReviewsApi = (userId, params) => axios.get(`/identity/users/${userId}/reviews`, { params });
const submitReviewApi = (jobId, payload) => axios.post(`/matchmaking/jobs/${jobId}/reviews`, payload);

export { getCustomerOverviewApi, getHandymanOverviewApi, getPublicProfileApi, getPublicReviewsApi, submitReviewApi };
