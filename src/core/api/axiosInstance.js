import axios from "axios";
import store from "../../redux/store.js";


const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/v1", 
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

// 2. RESPONSE INTERCEPTOR: handle data response and token refresh logic
axiosInstance.interceptors.response.use(
  function (response) {
    return response && response.data ? response.data : response;
  },
  async function (error) {
    const originalRequest = error.config;

    // Handle 401 errors - Unauthorized (token expired or invalid)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/auth/login") {
        return Promise.reject(error.response.data);
      }

      originalRequest._retry = true;

      // Handle token refresh 
      try {
        // Call API refresh token endpoint to get new access token 
        const res = await axiosInstance.post("/auth/refresh");

        if (res && res.EC === 0) {
          const newAccessToken = res.DT.access_token;

          // Update token in Redux store
          store.dispatch(setCredentials({ token: newAccessToken, user: res.DT.user }));

          // Attach new access token to original request and retry it
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          store.dispatch(logout());
          return Promise.reject(error.response.data);
        }
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return error && error.response && error.response.data
      ? Promise.reject(error.response.data)
      : Promise.reject(error);
  }
);

export default axiosInstance;