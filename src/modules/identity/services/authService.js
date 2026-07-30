import axios from '../../../core/api/axiosInstance';

const loginUserApi = (email, password) => {
    return axios.post('/auth/login', { valueLogin: email, password });
};

const registerUserApi = (email, password, full_name, phone_number, role) => {
    return axios.post('/auth/register', { email, password, full_name, phone_number, role });
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

const requestPasswordResetApi = (email) => axios.post('/auth/forgot-password', { email });
const validatePasswordResetApi = (token) => axios.post('/auth/password-reset/validate', { token });
const completePasswordResetApi = (payload) => axios.post('/auth/password-reset/complete', payload);
const requestSetPasswordApi = () => axios.post('/auth/set-password/request');
const validateSetPasswordApi = (token) => axios.post('/auth/set-password/validate', { token });
const completeSetPasswordApi = (payload) => axios.post('/auth/set-password/complete', payload);
const changePasswordApi = (payload) => axios.post('/auth/change-password', payload);


export { 
    loginUserApi, 
    registerUserApi, 
    logoutUserApi, 
    verifyEmailApi, 
    resendVerifyEmailApi,
    requestPasswordResetApi,
    validatePasswordResetApi,
    completePasswordResetApi,
    requestSetPasswordApi,
    validateSetPasswordApi,
    completeSetPasswordApi,
    changePasswordApi,
};
