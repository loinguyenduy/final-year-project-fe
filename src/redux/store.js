import { createStore } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Dùng localStorage
import rootReducer from "./rootReducer";

const persistConfig = {
  key: "trusted_handyman_root", // Đổi key cho đúng dự án mới
  storage,
  whitelist: ["identity"], // Chỉ lưu state của module identity (chứa token & user info)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(
  persistedReducer,
  process.env.NODE_ENV !== "production" && window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__()
    : (f) => f
);

export const persistor = persistStore(store);
export default store;