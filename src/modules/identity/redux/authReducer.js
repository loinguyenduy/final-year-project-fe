import {
  FETCH_USER_LOGIN_SUCCESS,
  USER_LOGOUT_SUCCESS,
  UPDATE_USER_INFO,
} from "./authAction";

const INITIAL_STATE = {
  account: {
    id: "",
    email: "",
    full_name: "",
    role: "",
    phone_number: "",
    avatar_url: "",
    is_email_verified: false,
  },
  isAuthenticated: false,
  token: "", 
};

const authReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_USER_LOGIN_SUCCESS:
      return {
        ...state,
        account: {
          id: action.payload.user.id,
          email: action.payload.user.email,
          full_name: action.payload.user.full_name,
          role: action.payload.user.role,
          phone_number: action.payload.user.phone_number || "",
          avatar_url: action.payload.user.avatar_url || "",
          is_email_verified: action.payload.user.is_email_verified,
        },
        isAuthenticated: true,
        token: action.payload.access_token,
      };

    case USER_LOGOUT_SUCCESS:
      return {
        ...INITIAL_STATE,
      };

    case UPDATE_USER_INFO:
      return {
        ...state,
        account: {
          ...state.account,
          full_name: action.payload.full_name || state.account.full_name,
          phone_number: action.payload.phone_number || state.account.phone_number,
          avatar_url: action.payload.avatar_url || state.account.avatar_url,
        },
      };

    default:
      return state;
  }
};

export default authReducer;