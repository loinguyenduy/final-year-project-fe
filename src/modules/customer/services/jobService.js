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

const updatePostedJobApi = (jobId, formData) => axios.patch(
    `/matchmaking/jobs/${jobId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
);

const cancelPreAcceptanceJobApi = (jobId, payload) => axios.post(
    `/matchmaking/jobs/${jobId}/pre-acceptance-cancellation`,
    payload,
);

const geocodeAddressApi = (data) => {
    return axios.post('/matchmaking/locations/geocode', data);
};

const reverseGeocodeApi = (gps_lat, gps_long) => {
    return axios.post('/matchmaking/locations/reverse-geocode', { gps_lat, gps_long });
};

const acceptBidApi = (jobId, bidId) => {
    return axios.post(`/matchmaking/jobs/${jobId}/bids/${bidId}/accept`);
};

const getDepositSummaryApi = (jobId, bidId) => {
    return axios.get(`/matchmaking/jobs/${jobId}/bids/${bidId}/deposit-summary`);
};

const acceptBidWithWalletDepositApi = (jobId, bidId) => {
    return axios.post(`/matchmaking/jobs/${jobId}/bids/${bidId}/accept-with-wallet-deposit`);
};

const getPublicHandymanProfileApi = (jobId, handymanId) => {
    return axios.get(`/matchmaking/jobs/${jobId}/handymen/${handymanId}/public-profile`);
};

const compareBidsApi = (data) => {
    return axios.post('/matchmaking/bids/compare', data);
};

export { 
    getServicesApi, 
    postJobApi, 
    updatePostedJobApi,
    cancelPreAcceptanceJobApi,
    getCustomerJobsApi, 
    getJobDetailsApi, 
    getProvincesApi, 
    getWardsApi, 
    geocodeAddressApi,
    reverseGeocodeApi,
    acceptBidApi,
    getDepositSummaryApi,
    acceptBidWithWalletDepositApi,
    getPublicHandymanProfileApi,
    compareBidsApi
};
