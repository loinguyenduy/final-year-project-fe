import axios from '../../../core/api/axiosInstance';

const getAvailableJobsApi = (search = '', service_id = '', sort_by = '', current_lat = null, current_long = null) => {
    let url = '/matchmaking/jobs/available';
    let queryParams = [];
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (service_id) queryParams.push(`service_id=${encodeURIComponent(service_id)}`);
    if (sort_by) queryParams.push(`sort_by=${encodeURIComponent(sort_by)}`);
    if (current_lat !== null) queryParams.push(`current_lat=${encodeURIComponent(current_lat)}`);
    if (current_long !== null) queryParams.push(`current_long=${encodeURIComponent(current_long)}`);
    
    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
    }
    
    return axios.get(url);
};

const getServicesApi = () => {
    return axios.get('/matchmaking/services');
};

const getJobDetailsApi = (id) => {
    return axios.get(`/matchmaking/jobs/${id}`);
};

export { getAvailableJobsApi, getServicesApi, getJobDetailsApi };
