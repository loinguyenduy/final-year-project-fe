import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Route Guards
import GuestRoute from "./core/routes/GuestRoute";
import PrivateRoute from "./core/routes/PrivateRoute";
import RoleRoute from "./core/routes/RoleRoute";

// Pages
import LoginPage from "./modules/identity/features/auth/LoginPage";
import RegisterPage from "./modules/identity/features/auth/RegisterPage";
import CheckEmailPage from "./modules/identity/features/auth/CheckEmailPage";
import VerifyEmailProcess from "./modules/identity/features/auth/VerifyEmailProcess";
import SocialCallback from "./modules/identity/features/auth/SocialCallback";

// Placeholder Components (Tạm thời để test Route)
const HomePage = () => <h2>Trang chủ (Dành cho Customer/Khách)</h2>;
const AdminDashboard = () => <h2>Trang Admin Dashboard</h2>;
const HandymanDashboard = () => <h2>Trang Thợ Dashboard</h2>;

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
          
          {/* Trang hiển thị thông báo "Check your email" sau khi đăng ký */}
          <Route path="/check-email" element={<CheckEmailPage />} />
          
          {/* Trang hứng Token từ email gửi về để gọi API Verify */}
          <Route path="/verify-email" element={<VerifyEmailProcess />} />
          
          {/* Trang hứng callback từ các nền tảng xã hội */}
          <Route path="/social-callback" element={<SocialCallback />} />

          {/* CÁC ROUTE PUBLIC HOẶC DÀNH CHO CUSTOMER */}
          <Route path="/" element={<HomePage />} />

          {/* CÁC ROUTE PRIVATE THEO ROLE */}
          <Route 
            path="/admin/dashboard" 
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleRoute>
            } 
          />

          <Route 
            path="/handyman/dashboard" 
            element={
              <RoleRoute allowedRoles={['HANDYMAN']}>
                <HandymanDashboard />
              </RoleRoute>
            } 
          />
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