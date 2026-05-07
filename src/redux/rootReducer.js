import { combineReducers } from "redux";
// Import authReducer từ module identity
import authReducer from "../modules/identity/redux/authReducer";

const rootReducer = combineReducers({
  identity: authReducer, // Đổi tên state tổng của module này thành 'identity' cho chuẩn
  // Sau này bạn có module khác thì import vào đây, ví dụ:
  // cart: cartReducer 
});

export default rootReducer;