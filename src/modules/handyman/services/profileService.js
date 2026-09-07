import axiosInstance from '../../../core/api/axiosInstance';

export const fetchProfileApi = () => axiosInstance.get('/identity/profile');

export const updateHandymanAddressApi = (data) =>
    axiosInstance.put('/identity/profile/address', data);

export const updateHandymanBioApi = (bio) =>
    axiosInstance.put('/identity/profile/handyman/bio', { bio });

export const addHandymanServiceApi = (service_id) =>
    axiosInstance.post('/identity/profile/handyman/services', { service_id });

export const removeHandymanServiceApi = (service_id) =>
    axiosInstance.delete(`/identity/profile/handyman/services/${service_id}`);

export const addHandymanServiceAreaApi = (province_code, ward_code) =>
    axiosInstance.post('/identity/profile/handyman/service-areas', {
        province_code,
        ...(ward_code ? { ward_code } : {})
    });

export const removeHandymanServiceAreaApi = (area_id) =>
    axiosInstance.delete(`/identity/profile/handyman/service-areas/${area_id}`);

export const updateHandymanWorkTimesApi = (preferred_work_times) =>
    axiosInstance.put('/identity/profile/handyman/work-times', { preferred_work_times });

export const getAllServicesApi = () => axiosInstance.get('/matchmaking/services');
export const getProvincesApi = () => axiosInstance.get('/matchmaking/provinces');
export const getWardsByProvinceApi = (province_code) =>
    axiosInstance.get(`/matchmaking/wards?province_code=${province_code}`);
