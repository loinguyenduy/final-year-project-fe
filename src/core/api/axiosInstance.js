import axios from "axios";
import store from "../../redux/store.js";


const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/v1", 
  withCredentials: true, // BẮT BUỘC để gửi Cookie kèm theo request
});

// 1. REQUEST INTERCEPTOR: Gắn Access Token vào mọi Request
axiosInstance.interceptors.request.use(
  function (config) {
    const token = store.getState().identity.token; 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR: Xử lý dữ liệu trả về và Auto Refresh Token
axiosInstance.interceptors.response.use(
  function (response) {
    // Backend của chúng ta luôn trả về object có dạng { EM, EC, DT }
    return response && response.data ? response.data : response;
  },
  async function (error) {
    const originalRequest = error.config;

    // NẾU LỖI 401 (Hết hạn Access Token) VÀ CHƯA TỪNG THỬ REFRESH
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Bỏ qua nếu API đang gọi chính là login hoặc refresh (để tránh vòng lặp vô tận)
      if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/auth/login") {
        return Promise.reject(error.response.data);
      }

      originalRequest._retry = true;

      try {
        // Gọi API refresh token (vì có withCredentials nên nó sẽ tự gửi Cookie lên)
        const res = await axiosInstance.post("/auth/refresh");

        if (res && res.EC === 0) {
          // Lấy token mới
          const newAccessToken = res.DT.access_token;

          store.dispatch(setCredentials({ token: newAccessToken, user: res.DT.user }));

          // Gắn token mới vào header của request đang bị lỗi và GỌI LẠI
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          // Nếu refresh thất bại (Refresh Token cũng hết hạn) -> Đăng xuất
          store.dispatch(logout());
          return Promise.reject(error.response.data);
        }
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    // Bắt các lỗi khác (ví dụ 400, 403, 500) và trả về chuẩn { EM, EC } của Backend
    return error && error.response && error.response.data
      ? Promise.reject(error.response.data)
      : Promise.reject(error);
  }
);

export default axiosInstance;