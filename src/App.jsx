// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import LanguageSelect from './pages/auth/LanguageSelect';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import WaitingApproval from './pages/auth/WaitingApproval';
import EmailVerified from './pages/auth/EmailVerified';
import FAQ from './pages/FAQ';
import CustomerHome from './pages/customer/CustomerHome';
import CreateRequest from './pages/customer/CreateRequest';
import MyRequests from './pages/customer/MyRequests';
import RequestDetail from './pages/customer/RequestDetail';
import MyBookings from './pages/customer/MyBookings';
import RateProvider from './pages/customer/RateProvider';
import CustomerNotifications from './pages/customer/CustomerNotifications';
import CustomerProfile from './pages/customer/CustomerProfile';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderRequestDetail from './pages/provider/ProviderRequestDetail';
import ProviderJobs from './pages/provider/ProviderJobs';
import ProviderNotifications from './pages/provider/ProviderNotifications';
import ProviderProfile from './pages/provider/ProviderProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminPlatform from './pages/admin/AdminPlatform';
import ProviderList from './pages/customer/ProviderList';
import ProviderDetail from './pages/customer/ProviderDetail';

export default function App() {
  return (
    <Routes>
      {/* Public Routes - No auth required */}
      <Route path="/" element={<Landing />} />
      <Route path="/language" element={<LanguageSelect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/email-verified" element={<EmailVerified />} />

      {/* Customer Routes - Protected, only customers */}
      <Route path="/customer/dashboard" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerHome />
        </ProtectedRoute>
      } />
      <Route path="/customer/create-request" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CreateRequest />
        </ProtectedRoute>
      } />
      <Route path="/customer/my-requests" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <MyRequests />
        </ProtectedRoute>
      } />
      <Route path="/customer/request/:id" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <RequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/customer/bookings" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <MyBookings />
        </ProtectedRoute>
      } />
      <Route path="/customer/rate/:bookingId" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <RateProvider />
        </ProtectedRoute>
      } />
      <Route path="/customer/providers" element={
  <ProtectedRoute allowedRoles={['customer']}>
    <ProviderList />
  </ProtectedRoute>
} />
<Route path="/customer/provider/:id" element={
  <ProtectedRoute allowedRoles={['customer']}>
    <ProviderDetail />
  </ProtectedRoute>
} />
      <Route path="/customer/notifications" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerNotifications />
        </ProtectedRoute>
      } />
      <Route path="/customer/profile" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerProfile />
        </ProtectedRoute>
      } />

      {/* Provider Routes - Protected, only providers (and must be approved) */}
      <Route path="/provider/dashboard" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderDashboard />
        </ProtectedRoute>
      } />
      <Route path="/provider/request/:id" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderRequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/provider/jobs" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderJobs />
        </ProtectedRoute>
      } />
      <Route path="/provider/notifications" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderNotifications />
        </ProtectedRoute>
      } />
      <Route path="/provider/profile" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderProfile />
        </ProtectedRoute>
      } />
      <Route path="/provider/waiting-approval" element={
        <ProtectedRoute allowedRoles={['provider']}>
          <WaitingApproval />
        </ProtectedRoute>
      } />

      {/* Admin Routes - Protected, only admins */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/approvals" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminApprovals />
        </ProtectedRoute>
      } />
      <Route path="/admin/platform" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPlatform />
        </ProtectedRoute>
      } />

      {/* Catch-all - Redirect to landing */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}