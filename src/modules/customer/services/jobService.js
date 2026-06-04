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

export { getServicesApi, postJobApi, getCustomerJobsApi };
