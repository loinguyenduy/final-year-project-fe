import axios from '../../../core/api/axiosInstance';

const getAdminWallets = (params, signal) => axios.get('/admin/wallets', { params, signal });
const getAdminTransactions = (params, signal) => axios.get('/admin/transactions', { params, signal });
const getAdminTransaction = (transactionId, signal) => axios.get(`/admin/transactions/${transactionId}`, { signal });

export { getAdminTransaction, getAdminTransactions, getAdminWallets };
