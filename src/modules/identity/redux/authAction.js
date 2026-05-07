export const FETCH_USER_LOGIN_SUCCESS = "FETCH_USER_LOGIN_SUCCESS";
export const USER_LOGOUT_SUCCESS = "USER_LOGOUT_SUCCESS";
export const UPDATE_USER_INFO = "UPDATE_USER_INFO";

// Action khi Đăng nhập thành công (Dùng cho cả Local và Social)
export const doLoginSuccess = (userInfo) => {
  return {
    type: FETCH_USER_LOGIN_SUCCESS,
    payload: userInfo, // payload sẽ là object DT từ API trả về { access_token, user: {...} }
  };
};

// Action khi Đăng xuất
export const doLogoutSuccess = () => {
  return {
    type: USER_LOGOUT_SUCCESS,
  };
};

// Action cập nhật thông tin cá nhân (Profile)
export const doUpdateUserInfo = (userData) => {
  return {
    type: UPDATE_USER_INFO,
    payload: userData,
  };
};