import { createStore } from "redux";
import { createTransform, persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./rootReducer";

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

const identityTransform = createTransform(
  sanitizePersistedIdentity,
  hydratePersistedIdentity,
  { whitelist: ["identity"] },
);

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
