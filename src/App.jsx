import { Routes, Route, Navigate } from 'react-router-dom'
import LanguageSelect from './pages/LanguageSelect'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import WaitingApproval from './pages/WaitingApproval'
import EmailVerified from './pages/EmailVerified'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import CustomerHome from './pages/CustomerHome'
import CreateRequest from './pages/CreateRequest'
import MyRequests from './pages/MyRequests'
import RequestDetail from './pages/RequestDetail'
import MyBookings from './pages/MyBookings'
import RateProvider from './pages/RateProvider'
import CustomerNotifications from './pages/CustomerNotifications'
import CustomerProfile from './pages/CustomerProfile'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderRequestDetail from './pages/ProviderRequestDetail'
import ProviderJobs from './pages/ProviderJobs'
import ProviderNotifications from './pages/ProviderNotifications'
import ProviderProfile from './pages/ProviderProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminApprovals from './pages/AdminApprovals'
import AdminPlatform from './pages/AdminPlatform'
import FAQ from './pages/FAQ'
export default function App() {
  return (
    <Routes>
      <Route path="/faq" element={<FAQ />} />

      <Route path="/" element={<LanguageSelect />} />
      <Route path="/landing" element={<Landing />} />
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