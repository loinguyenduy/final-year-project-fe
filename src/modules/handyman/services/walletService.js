import axiosInstance from "../../../core/api/axiosInstance";

export const topUpWalletApi = (data) => {
    return axiosInstance.post("/fintech/wallets/top-up", data);
};
export const getMyWalletsApi = () => axiosInstance.get('/fintech/wallets/me');
