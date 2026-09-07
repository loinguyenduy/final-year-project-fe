import axios from '../../../core/api/axiosInstance';
import { buildApiUrl } from '../../../core/config/runtimeUrls';

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

const beginSocialLink = async (provider) => {
    const normalizedProvider = String(provider || '').toLowerCase();
    if (!['google', 'facebook'].includes(normalizedProvider)) {
        throw new Error('Unsupported social provider.');
    }

    const response = await axios.post(`/auth/${normalizedProvider}/link-state`);
    const state = response?.DT?.state;
    if (response?.EC !== 0 || typeof state !== 'string' || !state) {
        throw new Error('Unable to start social account linking.');
    }

    const linkUrl = new URL(buildApiUrl(`/auth/${normalizedProvider}/link`));
    linkUrl.searchParams.set('state', state);
    window.location.assign(linkUrl.toString());
};


export { 
    beginSocialLink,
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
