import axiosInstance from "../../../core/api/axiosInstance";

export const topUpWalletApi = (data) => {
    return axiosInstance.post("/fintech/wallets/top-up", data);
};