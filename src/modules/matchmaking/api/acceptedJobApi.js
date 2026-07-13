import axios from '../../../core/api/axiosInstance';

/**
 * Lấy thông tin chi tiết job ở trạng thái ACCEPTED (dùng chung cho Customer và Handyman)
 * @param {string} jobId 
 * @returns {Promise<any>}
 */
export const getAcceptedJobDetailsApi = (jobId) => {
    return axios.get(`/matchmaking/jobs/${jobId}/accepted-details`);
};

/**
 * Customer hủy job đang ở trạng thái ACCEPTED
 * @param {string} jobId 
 * @param {Object} payload 
 * @param {string} payload.action 'REOPEN_BIDDING' | 'CANCEL_JOB'
 * @param {string} payload.reason_code
 * @param {string} [payload.reason_text]
 * @returns {Promise<any>}
 */
export const cancelAcceptedJobByCustomerApi = (jobId, payload) => {
    return axios.post(`/matchmaking/jobs/${jobId}/cancel-by-customer`, payload);
};

/**
 * Handyman hủy job đang ở trạng thái ACCEPTED
 * @param {string} jobId 
 * @param {Object} payload
 * @param {string} payload.reason_code
 * @param {string} [payload.reason_text] 
 * @returns {Promise<any>}
 */
export const cancelAcceptedJobByHandymanApi = (jobId, payload) => {
    return axios.post(`/matchmaking/jobs/${jobId}/cancel-by-handyman`, payload);
};

/**
 * Handyman bắt đầu di chuyển đến địa điểm
 * @param {string} jobId 
 * @param {Object} [payload] 
 * @param {number} [payload.gps_lat]
 * @param {number} [payload.gps_long]
 * @returns {Promise<any>}
 */
export const startMovingApi = (jobId, payload = {}) => {
    return axios.post(`/matchmaking/jobs/${jobId}/start-moving`, payload);
};
