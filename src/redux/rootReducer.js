import { combineReducers } from "redux";
// Import authReducer từ module identity
import authReducer from "../modules/identity/redux/authReducer";

const rootReducer = combineReducers({
  identity: authReducer,
});

export default rootReducer;