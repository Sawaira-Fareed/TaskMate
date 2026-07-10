import { Routes, Route, Navigate } from 'react-router-dom'


import LanguageSelect from './pages/auth/LanguageSelect'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import WaitingApproval from './pages/auth/WaitingApproval'
import EmailVerified from './pages/auth/EmailVerified'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import CustomerHome from './pages/customer/CustomerHome'
import CreateRequest from './pages/customer/CreateRequest'
import MyRequests from './pages/customer/MyRequests'
import RequestDetail from './pages/customer/RequestDetail'
import MyBookings from './pages/customer/MyBookings'
import RateProvider from './pages/customer/RateProvider'
import CustomerNotifications from './pages/customer/CustomerNotifications'
import CustomerProfile from './pages/customer/CustomerProfile'
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderRequestDetail from './pages/provider/ProviderRequestDetail'
import ProviderJobs from './pages/provider/ProviderJobs'
import ProviderNotifications from './pages/provider/ProviderNotifications'
import ProviderProfile from './pages/provider/ProviderProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminApprovals from './pages/admin/AdminApprovals'
import AdminPlatform from './pages/admin/AdminPlatform'

import FAQ from './pages/FAQ'
export default function App() {
  return (
    <Routes>
      <Route path="/faq" element={<FAQ />} />

      <Route path="/language" element={<LanguageSelect />} />
       <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/waiting-approval" element={<WaitingApproval />} />
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/customer-home" element={<CustomerHome />} />
      <Route path="/create-request" element={<CreateRequest />} />
      <Route path="/my-requests" element={<MyRequests />} />
      <Route path="/request/:id" element={<RequestDetail />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/rate/:id" element={<RateProvider />} />
      <Route path="/notifications" element={<CustomerNotifications />} />
      <Route path="/profile" element={<CustomerProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/provider-dashboard" element={<ProviderDashboard />} />
<Route path="/provider-request/:id" element={<ProviderRequestDetail />} />
<Route path="/provider-jobs" element={<ProviderJobs />} />
<Route path="/provider-notifications" element={<ProviderNotifications />} />
<Route path="/provider-profile" element={<ProviderProfile />} />
<Route path="/admin-dashboard" element={<AdminDashboard />} />
<Route path="/admin-approvals" element={<AdminApprovals />} />
<Route path="/admin-platform" element={<AdminPlatform />} />
    </Routes>
  )
}