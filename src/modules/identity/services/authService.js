import axios from '../../../core/api/axiosInstance';

const loginUserApi = (email, password) => {

    return axios.post('/auth/login', { valueLogin: email, password });
};

const registerUserApi = (email, password, full_name, phone_number) => {
    return axios.post('/auth/register', { email, password, full_name, phone_number });
};

const logoutUserApi = () => {
    return axios.post('/auth/logout');
};

const verifyEmailApi = (token) => {
    return axios.get(`/auth/verify-email?token=${token}`);
};

const resendVerifyEmailApi = (email) => {
    return axios.post('/auth/resend-verification', { email });
};

export { 
    loginUserApi, 
    registerUserApi, 
    logoutUserApi, 
    verifyEmailApi, 
    resendVerifyEmailApi 
};