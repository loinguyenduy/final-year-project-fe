import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Route Guards
import GuestRoute from "./core/routes/GuestRoute";
import PrivateRoute from "./core/routes/PrivateRoute";
import RoleRoute from "./core/routes/RoleRoute";

// Pages
import LoginPage from "./modules/identity/features/auth/pages/LoginPage";
import RegisterPage from "./modules/identity/features/auth/pages/RegisterPage";
import CheckEmailPage from "./modules/identity/features/auth/pages/CheckEmailPage";
import VerifyEmailProcess from "./modules/identity/features/auth/pages/VerifyEmailProcess";
import SocialCallback from "./modules/identity/features/auth/pages/SocialCallback";
import MainLayout from "./core/layouts/MainLayout";
import HomePage from "./modules/home/pages/HomePage";

import CustomerLayout from "./modules/customer/features/dashboard/components/CustomerLayout"; 
import CustomerDashboardPage from "./modules/customer/features/dashboard/pages/CustomerDashboardPage";
import CustomerProfilePage from "./modules/customer/features/profile-kyc/pages/CustomerProfilePage";




function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* CÁC ROUTE KHÁCH VÃNG LAI (GUEST) */}
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            } 
          />
          
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify-email" element={<VerifyEmailProcess />} />
          <Route path="/social-callback" element={<SocialCallback />} />

            {/* CÁC ROUTE CÓ CHUNG MAIN LAYOUT KÈM HEADER/FOOTER */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
          </Route>


          {/* CÁC ROUTE PRIVATE THEO ROLE */}
          <Route element={<RoleRoute allowedRoles={['CUSTOMER']}><CustomerLayout /> </RoleRoute>}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;