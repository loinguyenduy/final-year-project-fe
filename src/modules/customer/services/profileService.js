import axios from '../../../core/api/axiosInstance';

const getUserProfileApi = () => axios.get('/identity/profile');

const updateUserAddressApi = (data) =>
    axios.put('/identity/profile/address', data);

const getProvincesApi = () =>
    axios.get('/matchmaking/provinces');

const getWardsByProvinceApi = (province_code) =>
    axios.get(`/matchmaking/wards?province_code=${province_code}`);

export { getUserProfileApi, updateUserAddressApi, getProvincesApi, getWardsByProvinceApi };
