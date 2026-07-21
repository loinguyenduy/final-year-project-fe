import axios from '../../../core/api/axiosInstance';

const topUpWalletApi = (data) => {
    return axios.post('/fintech/wallets/top-up', data);
};
const getMyWalletsApi = () => axios.get('/fintech/wallets/me');

export { getMyWalletsApi, topUpWalletApi };
