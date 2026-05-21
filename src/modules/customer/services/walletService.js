import axios from '../../../core/api/axiosInstance';

const topUpWalletApi = (data) => {
    return axios.post('/fintech/wallets/top-up', data);
};

export { topUpWalletApi };
