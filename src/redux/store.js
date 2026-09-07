import { createStore } from "redux";
import { createTransform, persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./rootReducer";

// Hàm được sử dụng để làm sạch trạng thái "identity" trước khi lưu trữ vào localStorage. 
// Nó đảm bảo rằng các trường quan trọng có kiểu dữ liệu đúng và không chứa giá trị không hợp lệ.
const sanitizePersistedIdentity = (state = {}) => ({
  isAuthenticated: Boolean(state.isAuthenticated),
  token: typeof state.token === "string" ? state.token : "",
  account: {
    id: typeof state.account?.id === "string" ? state.account.id : "",
    role: typeof state.account?.role === "string" ? state.account.role : "",
    full_name: typeof state.account?.full_name === "string" ? state.account.full_name : "",
    avatar_url: typeof state.account?.avatar_url === "string" ? state.account.avatar_url : "",
  },
});

// Hàm được sử dụng để khôi phục trạng thái "identity" từ localStorage.
const hydratePersistedIdentity = (state = {}) => {
  const identity = sanitizePersistedIdentity(state);
  return {
    ...identity,
    account: {
      email: "",
      phone_number: "",
      is_email_verified: false,
      kyc_status: "UNVERIFIED",
      wallets: [],
      auth_providers: [],
      kyc_requests: [],
      handyman_profile: null,
      ...identity.account,
    },
  };
};

// Tạo một transform để xử lý việc lưu trữ và khôi phục trạng thái "identity" trong Redux Persist.
const identityTransform = createTransform(
  sanitizePersistedIdentity,
  hydratePersistedIdentity,
  { whitelist: ["identity"] },
);

// Cấu hình Redux Persist để lưu trữ trạng thái "identity" vào localStorage
const persistConfig = {
  key: "trusted_handyman_root", 
  storage,
  whitelist: ["identity"],
  version: 2,
  transforms: [identityTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(
  persistedReducer,
  import.meta.env.DEV && window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__() 
    : (f) => f
);

export const persistor = persistStore(store);
export default store;
