import axios from '../../../core/api/axiosInstance';

const getAdminServices = (params, signal) => axios.get('/admin/services', { params, signal });
const createAdminService = (payload) => axios.post('/admin/services', payload);
const updateAdminService = (serviceId, payload) => axios.patch(`/admin/services/${serviceId}`, payload);
const setAdminServiceActive = (serviceId, activate) => axios.post(`/admin/services/${serviceId}/${activate ? 'activate' : 'deactivate'}`);

export { createAdminService, getAdminServices, setAdminServiceActive, updateAdminService };
