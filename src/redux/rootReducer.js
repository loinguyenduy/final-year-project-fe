import { combineReducers } from "redux";
import authReducer from "../modules/identity/redux/authReducer";

const rootReducer = combineReducers({
  identity: authReducer,
});

export default rootReducer;