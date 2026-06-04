import axios from '../../../core/api/axiosInstance';

export const fetchPendingKyc = () => {
    return axios.get('/admin/kyc/pending');
};

export const reviewKyc = (data) => {
    return axios.post('/admin/kyc/review', data);
};