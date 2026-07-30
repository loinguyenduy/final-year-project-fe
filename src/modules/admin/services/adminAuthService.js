import axios from '../../../core/api/axiosInstance';

const loginAdmin = (credentials) => axios.post('/auth/admin/login', credentials);
const getAdminSession = () => axios.get('/auth/admin/session');
const logoutAdmin = () => axios.post('/auth/logout');

export { getAdminSession, loginAdmin, logoutAdmin };
