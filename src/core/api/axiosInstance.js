import axios from "axios";
import store from "../../redux/store.js";
import { doLogoutSuccess, doUpdateAccessToken } from "../../modules/identity/redux/authAction";


const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // automatically send cookies (Refresh Token) in requests to the backend
});

// 1. REQUEST INTERCEPTOR: attach access token in header before sending request
axiosInstance.interceptors.request.use(
  function (config) {
    const token = store.getState().identity.token; // get token from Redux state
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 2. RESPONSE INTERCEPTOR: handle data response and token refresh logic
axiosInstance.interceptors.response.use(
  function (response) {
    return response && response.data ? response.data : response;
  },
  async function (error) {
    const originalRequest = error.config;
    const responseCode = error.response?.data?.code;

    if (['ADMIN_NOT_ACTIVE', 'ADMIN_ROLE_REQUIRED', 'ADMIN_SESSION_EXPIRED'].includes(responseCode)) {
      store.dispatch(doLogoutSuccess());
      return Promise.reject(error.response.data);
    }

    // Handle 401 errors - Unauthorized (token expired or invalid)
    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
      
      if (["/auth/refresh", "/auth/login", "/auth/admin/login"].includes(originalRequest.url)) {
        return Promise.reject(error.response.data);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Handle token refresh 
      try {
        // Call API refresh token endpoint to get new access token 
        const res = await axiosInstance.post("/auth/refresh");

        if (res && res.EC === 0) {
          const newAccessToken = res.DT.access_token;

          // Update token in Redux store
          store.dispatch(doUpdateAccessToken(newAccessToken));

          // Process queue
          processQueue(null, newAccessToken);

          // Attach new access token to original request and retry it
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          processQueue(error.response ? error.response.data : error, null);
          store.dispatch(doLogoutSuccess());
          return Promise.reject(error.response ? error.response.data : error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(doLogoutSuccess());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return error && error.response && error.response.data
      ? Promise.reject(error.response.data)
      : Promise.reject(error);
  }
);

export default axiosInstance;
