export const FETCH_USER_LOGIN_SUCCESS = "FETCH_USER_LOGIN_SUCCESS";
export const USER_LOGOUT_SUCCESS = "USER_LOGOUT_SUCCESS";
export const UPDATE_USER_INFO = "UPDATE_USER_INFO";

export const doLoginSuccess = (userInfo) => {
  return {
    type: FETCH_USER_LOGIN_SUCCESS,
    payload: userInfo, 
  };
};

export const doLogoutSuccess = () => {
  return {
    type: USER_LOGOUT_SUCCESS,
  };
};

export const doUpdateUserInfo = (userData) => {
  return {
    type: UPDATE_USER_INFO,
    payload: userData,
  };
};