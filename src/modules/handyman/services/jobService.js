import axios from '../../../core/api/axiosInstance';

const getAvailableJobsApi = (search = '', service_id = '') => {
    let url = '/matchmaking/jobs/available';
    let queryParams = [];
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (service_id) queryParams.push(`service_id=${encodeURIComponent(service_id)}`);
    
    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
    }
    
    return axios.get(url);
};

const getServicesApi = () => {
    return axios.get('/matchmaking/services');
};

export { getAvailableJobsApi, getServicesApi };
