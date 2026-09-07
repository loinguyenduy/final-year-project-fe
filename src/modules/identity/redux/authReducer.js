import {
  FETCH_USER_LOGIN_SUCCESS,
  USER_LOGOUT_SUCCESS,
  UPDATE_USER_INFO,
  FETCH_PROFILE_SUCCESS,
  UPDATE_ACCESS_TOKEN,
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
    kyc_status: "UNVERIFIED", 
    kyc_rejection: null,
    wallets: [],
    auth_providers: [], 
    kyc_requests: [],
    handyman_profile: {
      handyman_level: "C0",
      security_bond_status: "UNPAID",
      total_jobs_completed: 0,
      rating_summary: null
    },
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
          kyc_status: action.payload.user.kyc_status || "UNVERIFIED",
          kyc_rejection: action.payload.user.kyc_rejection || null,
          wallets: action.payload.user.wallet_summary || [],
          auth_providers: action.payload.user.linked_providers || [],
          kyc_requests: action.payload.user.kyc_submissions || [],
          handyman_profile: action.payload.user.profile || INITIAL_STATE.account.handyman_profile,
          rating_summary: action.payload.user.rating_summary || null,
          password_capability: action.payload.user.password_capability || null
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

    case FETCH_PROFILE_SUCCESS:
      return {
        ...state,
        account: {
          ...state.account,
          ...action.payload,
          wallets: action.payload.wallet_summary || state.account.wallets,
          auth_providers: action.payload.linked_providers || state.account.auth_providers,
          kyc_requests: action.payload.kyc_submissions || state.account.kyc_requests,
          handyman_profile: action.payload.profile || state.account.handyman_profile,
          rating_summary: action.payload.rating_summary || state.account.rating_summary,
          password_capability: action.payload.password_capability || state.account.password_capability
        }
      };

    case UPDATE_ACCESS_TOKEN:
      return {
        ...state,
        token: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;
