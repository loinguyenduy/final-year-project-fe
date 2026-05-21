import axios from '../../../core/api/axiosInstance';

const getUserProfileApi = () => {
    return axios.get('/identity/profile');
};

export { getUserProfileApi };