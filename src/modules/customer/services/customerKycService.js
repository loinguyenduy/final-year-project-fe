import axios from '../../../core/api/axiosInstance';

const submitCustomerKycApi = (formData) => {
    return axios.post('/identity/kyc/customer/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export { submitCustomerKycApi };