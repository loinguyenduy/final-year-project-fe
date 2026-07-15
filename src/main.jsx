import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux/store.js";
import App from "./App.jsx";
import AuthSessionGate from "./core/routes/AuthSessionGate.jsx";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "leaflet/dist/leaflet.css";
import "react-toastify/dist/ReactToastify.css";
import 'bootstrap/dist/js/bootstrap.bundle.min';

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode> 
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthSessionGate>
          <App />
        </AuthSessionGate>
      </PersistGate>
    </Provider>
  // </React.StrictMode>
);
