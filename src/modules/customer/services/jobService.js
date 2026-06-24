import axios from '../../../core/api/axiosInstance';

const getServicesApi = () => {
    return axios.get('/matchmaking/services');
};

const postJobApi = (formData) => {
    return axios.post('/matchmaking/jobs', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

const getCustomerJobsApi = () => {
    return axios.get('/matchmaking/jobs');
};

const getJobDetailsApi = (id) => {
    return axios.get(`/matchmaking/jobs/${id}`);
};

const getProvincesApi = () => {
    return axios.get('/matchmaking/provinces');
};

const getWardsApi = (province_code) => {
    return axios.get(`/matchmaking/wards?province_code=${province_code}`);
};

export { getServicesApi, postJobApi, getCustomerJobsApi, getJobDetailsApi, getProvincesApi, getWardsApi };
