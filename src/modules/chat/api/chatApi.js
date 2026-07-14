import axios from '../../../core/api/axiosInstance';
import { MESSAGE_PAGE_SIZE } from '../constants/chat.constants';

const getConversationByJobApi = (jobId) => {
  return axios.get(`/chat/jobs/${jobId}/conversation`);
};

const createOrGetConversationApi = (jobId) => {
  return axios.post(`/chat/jobs/${jobId}/conversation`, {});
};

const getConversationMessagesApi = (
  conversationId,
  { cursor = null, limit = MESSAGE_PAGE_SIZE } = {},
) => {
  return axios.get(`/chat/conversations/${conversationId}/messages`, {
    params: {
      limit,
      ...(cursor ? { cursor } : {}),
    },
  });
};

export {
  createOrGetConversationApi,
  getConversationByJobApi,
  getConversationMessagesApi,
};
