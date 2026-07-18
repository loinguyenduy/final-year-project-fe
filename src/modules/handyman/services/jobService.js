import axios from '../../../core/api/axiosInstance';

const getAvailableJobsApi = (search = '', service_id = '', sort_by = '', current_lat = null, current_long = null) => {
    let url = '/matchmaking/jobs/available';
    let params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (service_id) params.push(`service_id=${encodeURIComponent(service_id)}`);
    if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`);
    if (current_lat !== null) params.push(`current_lat=${encodeURIComponent(current_lat)}`);
    if (current_long !== null) params.push(`current_long=${encodeURIComponent(current_long)}`);
    if (params.length > 0) url += '?' + params.join('&');
    return axios.get(url);
};

const getServicesApi = () => {
    return axios.get('/matchmaking/services');
};

const getJobDetailsApi = (id, current_lat = null, current_long = null) => {
    let url = `/matchmaking/jobs/${id}`;
    let params = [];
    if (current_lat !== null) params.push(`current_lat=${encodeURIComponent(current_lat)}`);
    if (current_long !== null) params.push(`current_long=${encodeURIComponent(current_long)}`);
    if (params.length > 0) url += '?' + params.join('&');
    return axios.get(url);
};

const submitBidApi = (jobId, bidData) => {
    return axios.post(`/matchmaking/jobs/${jobId}/bids`, bidData);
};

const updateBidApi = (jobId, bidId, bidData) => {
    return axios.patch(`/matchmaking/jobs/${jobId}/bids/${bidId}`, bidData);
};

const withdrawBidApi = (jobId, bidId) => {
    return axios.delete(`/matchmaking/jobs/${jobId}/bids/${bidId}`);
};

const getMyBidsApi = () => {
    return axios.get('/matchmaking/handyman/my-bids');
};

export { getAvailableJobsApi, getServicesApi, getJobDetailsApi, submitBidApi, updateBidApi, withdrawBidApi, getMyBidsApi };
