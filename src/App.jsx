import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Navigate } from "react-router-dom";

// Route Guards
import GuestRoute from "./core/routes/GuestRoute";
import RoleRoute from "./core/routes/RoleRoute";
import AdminRoute from './core/routes/AdminRoute';

// Pages
import LoginPage from "./modules/identity/features/auth/pages/LoginPage";
import RegisterPage from "./modules/identity/features/auth/pages/RegisterPage";
import CheckEmailPage from "./modules/identity/features/auth/pages/CheckEmailPage";
import VerifyEmailProcess from "./modules/identity/features/auth/pages/VerifyEmailProcess";
import SocialCallback from "./modules/identity/features/auth/pages/SocialCallback";
import SocialLinkCallback from "./modules/identity/features/auth/pages/SocialLinkCallback";
import ForgotPasswordPage from './modules/identity/features/auth/pages/ForgotPasswordPage';
import PasswordActionPage from './modules/identity/features/auth/pages/PasswordActionPage';
import PublicProfilePage from './modules/identity/features/profile/pages/PublicProfilePage';
import MainLayout from "./core/layouts/MainLayout";
import HomePage from "./modules/home/pages/HomePage";

import CustomerLayout from "./modules/customer/features/dashboard/components/CustomerLayout"; 
import CustomerDashboardPage from "./modules/customer/features/dashboard/pages/CustomerDashboardPage";
import CustomerProfilePage from "./modules/customer/features/profile-kyc/pages/CustomerProfilePage";
import CustomerWalletPage from "./modules/customer/features/wallet/pages/CustomerWalletPage";
import CustomerCreateJobPage from "./modules/customer/features/jobs/pages/CustomerCreateJobPage";
import CustomerMyJobsPage from "./modules/customer/features/jobs/pages/CustomerMyJobsPage";
import CustomerJobDetailsPage from "./modules/customer/features/jobs/pages/CustomerJobDetailsPage";
import PaymentResultPage from "./core/features/payment/pages/PaymentResultPage";
import HandymanLayout from "./modules/handyman/features/dashboard/components/HandymanLayout";
import HandymanDashboardPage from "./modules/handyman/features/dashboard/pages/HandymanDashboardPage";
import HandymanWalletPage from "./modules/handyman/features/wallet/pages/HandymanWalletPage";
import HandymanProfilePage from "./modules/handyman/features/profile/pages/HandymanProfilePage";
import HandymanFindJobPage from "./modules/handyman/features/jobs/pages/HandymanFindJobPage";
import HandymanJobDetailsPage from "./modules/handyman/features/jobs/pages/HandymanJobDetailsPage";
import HandymanMyJobsPage from "./modules/handyman/features/jobs/pages/HandymanMyJobsPage";
import LifecycleWorkspaceLayout from "./modules/matchmaking/features/job-lifecycle/layouts/LifecycleWorkspaceLayout";
import JobLifecyclePage from "./modules/matchmaking/features/job-lifecycle/pages/JobLifecyclePage";

import AdminLayout from './modules/admin/layouts/AdminLayout';
import AdminLoginPage from './modules/admin/features/login/pages/AdminLoginPage';
import KycManagementPage from "./modules/admin/features/kyc/pages/KycManagementPage";
import AdminJobsPage from "./modules/admin/features/jobs/pages/AdminJobsPage";
import AdminJobDetailPage from "./modules/admin/features/jobs/pages/AdminJobDetailPage";
import LegacyReviewRedirect from "./modules/admin/features/jobs/pages/LegacyReviewRedirect";
import AdminUsersPage from './modules/admin/features/users/pages/AdminUsersPage';
import AdminUserDetailPage from './modules/admin/features/users/pages/AdminUserDetailPage';
import AdminWalletsPage from './modules/admin/features/finance/pages/AdminWalletsPage';
import AdminTransactionsPage from './modules/admin/features/finance/pages/AdminTransactionsPage';
import AdminTransactionDetailPage from './modules/admin/features/finance/pages/AdminTransactionDetailPage';
import AdminServicesPage from './modules/admin/features/services/pages/AdminServicesPage';

const AdminDashboardPage = React.lazy(() => import('./modules/admin/features/dashboard/pages/AdminDashboardPage'));
const AdminAuditPage = React.lazy(() => import('./modules/admin/features/audit/pages/AdminAuditPage'));
const AdminAuditDetailPage = React.lazy(() => import('./modules/admin/features/audit/pages/AdminAuditDetailPage'));
const adminLazy = (page) => <React.Suspense fallback={<div role="status">Loading Administrator module...</div>}>{page}</React.Suspense>;

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
          <Route path="/social-link-callback" element={<SocialLinkCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<PasswordActionPage mode="RESET" />} />
          <Route path="/set-password" element={<PasswordActionPage mode="SET" />} />
          
          <Route path="/payment-success" element={<PaymentResultPage />} />
          <Route path="/payment-cancel" element={<PaymentResultPage />} />

            {/* CÁC ROUTE CÓ CHUNG MAIN LAYOUT KÈM HEADER/FOOTER */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
          </Route>


          {/* CÁC ROUTE PRIVATE THEO ROLE */}
          <Route
            path="/jobs/:jobId/lifecycle"
            element={
              <RoleRoute allowedRoles={['CUSTOMER', 'HANDYMAN']}>
                <LifecycleWorkspaceLayout />
              </RoleRoute>
            }
          >
            <Route index element={<JobLifecyclePage />} />
          </Route>
          <Route path="/participants/:userId/profile" element={<RoleRoute allowedRoles={['CUSTOMER', 'HANDYMAN']}><PublicProfilePage /></RoleRoute>} />

          <Route element={<RoleRoute allowedRoles={['CUSTOMER']}><CustomerLayout /> </RoleRoute>}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
            <Route path="/customer/wallet" element={<CustomerWalletPage />} />
            <Route path="/customer/ai-diagnosis" element={<CustomerCreateJobPage />} />
            <Route path="/customer/my-jobs" element={<CustomerMyJobsPage />} />
            <Route path="/customer/my-jobs/:id" element={<CustomerJobDetailsPage />} />
            <Route path="/customer/my-jobs/:id/edit" element={<CustomerCreateJobPage />} />
          </Route>
          
          {/* HANDYMAN ROUTES */}
          <Route element={<RoleRoute allowedRoles={['HANDYMAN']}><HandymanLayout /></RoleRoute>}>
            <Route path="/handyman/dashboard" element={<HandymanDashboardPage />} />
            <Route path="/handyman/wallet" element={<HandymanWalletPage />} />
            <Route path="/handyman/profile" element={<HandymanProfilePage />} />
            <Route path="/handyman/find-jobs" element={<HandymanFindJobPage />} />
            <Route path="/handyman/jobs/:id" element={<HandymanJobDetailsPage />} />
            <Route path="/handyman/my-jobs" element={<HandymanMyJobsPage />} />
            <Route path="/handyman/my-bids" element={<Navigate to="/handyman/my-jobs" replace />} />
          </Route>

          {/* --- LUỒNG ADMIN --- */}
        <Route path="/admin/login" element={
            <GuestRoute>
                <AdminLoginPage />
            </GuestRoute>
        } />

        {/* Luồng quản trị nội bộ */}
        <Route path="/admin" element={
            <AdminRoute>
                <AdminLayout />
            </AdminRoute>
        }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={adminLazy(<AdminDashboardPage />)} />
            <Route path="kyc" element={<KycManagementPage/>}/>
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<AdminUserDetailPage />} />
            <Route path="wallets" element={<AdminWalletsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="transactions/:transactionId" element={<AdminTransactionDetailPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="audit" element={adminLazy(<AdminAuditPage />)} />
            <Route path="audit/:auditId" element={adminLazy(<AdminAuditDetailPage />)} />
            <Route path="reviews" element={<LegacyReviewRedirect list />} />
            <Route path="reviews/:caseType/:caseId" element={<LegacyReviewRedirect />} />
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
