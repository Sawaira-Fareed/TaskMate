import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import ProviderPricing from './pages/provider/ProviderPricing'
import Chat from './pages/customer/Chat'
import ProviderChat from './pages/provider/Chat'
import AdminProUpgrades from './pages/admin/AdminProUpgrades'
import NotFound from './pages/NotFound'
import RideRequests from './pages/provider/RideRequests'
import ErrorBoundary from './components/ErrorBoundary'
import BookRide from './pages/customer/BookRide'
import AdminNotifications from './pages/admin/AdminNotifications'


import BecomeProvider from './pages/auth/BecomeProvider'




export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      {/* Public Routes - No auth required, no Layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/language" element={<LanguageSelect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/email-verified" element={<EmailVerified />} />

      {/* Protected Routes - All wrapped in Layout for mobile bottom nav */}
      <Route element={<Layout />}>
        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>
        } />
        <Route path="/customer/create-request" element={
          <ProtectedRoute allowedRoles={['customer']}><CreateRequest /></ProtectedRoute>
        } />
        <Route path="/customer/my-requests" element={
          <ProtectedRoute allowedRoles={['customer']}><MyRequests /></ProtectedRoute>
        } />
        <Route path="/customer/request/:id" element={
          <ProtectedRoute allowedRoles={['customer']}><RequestDetail /></ProtectedRoute>
        } />
        <Route path="/customer/bookings" element={
          <ProtectedRoute allowedRoles={['customer']}><MyBookings /></ProtectedRoute>
        } />
        <Route path="/customer/rate/:bookingId" element={
          <ProtectedRoute allowedRoles={['customer']}><RateProvider /></ProtectedRoute>
        } />
        <Route path="/customer/notifications" element={
          <ProtectedRoute allowedRoles={['customer']}><CustomerNotifications /></ProtectedRoute>
        } />
        <Route path="/customer/profile" element={
          <ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>
        } />
        <Route path="/customer/providers" element={
          <ProtectedRoute allowedRoles={['customer']}><ProviderList /></ProtectedRoute>
        } />
        <Route path="/customer/provider/:id" element={
          <ProtectedRoute allowedRoles={['customer']}><ProviderDetail /></ProtectedRoute>
        } />

        {/* Provider Routes */}
        <Route path="/provider/dashboard" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderDashboard /></ProtectedRoute>
        } />
        <Route path="/provider/request/:id" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderRequestDetail /></ProtectedRoute>
        } />
        <Route path="/provider/jobs" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderJobs /></ProtectedRoute>
        } />
        <Route path="/provider/notifications" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderNotifications /></ProtectedRoute>
        } />
        <Route path="/provider/profile" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderProfile /></ProtectedRoute>
        } />
        // Customer chat
<Route path="/customer/chat/:bookingId" element={
  <ProtectedRoute allowedRoles={['customer']}><Chat /></ProtectedRoute>
} />

// Provider chat
<Route path="/provider/chat/:bookingId" element={
  <ProtectedRoute allowedRoles={['provider']}><ProviderChat /></ProtectedRoute>
} />

<Route path="/provider/ride-requests" element={
  <ProtectedRoute allowedRoles={['provider']}><RideRequests /></ProtectedRoute>
} />

        <Route path="/provider/waiting-approval" element={
          <ProtectedRoute allowedRoles={['provider']}><WaitingApproval /></ProtectedRoute>
        } />
        <Route path="/provider/pricing" element={
  <ProtectedRoute allowedRoles={['provider']}>
    <ProviderPricing />
  </ProtectedRoute>
} />
<Route path="/customer/book-ride" element={
  <ProtectedRoute allowedRoles={['customer']}><BookRide /></ProtectedRoute>
} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/approvals" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminApprovals /></ProtectedRoute>
        } />
        <Route path="/admin/platform" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminPlatform /></ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
  <ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>
} />
      </Route>
      <Route path="/admin/pro-upgrades" element={
  <ProtectedRoute allowedRoles={['admin']}><AdminProUpgrades /></ProtectedRoute>
} />

<Route path="/become-provider" element={
  <ProtectedRoute allowedRoles={['customer']}><BecomeProvider /></ProtectedRoute>
} />
      {/* Catch-all */}
      {/* Catch-all — 404 page */}
<Route path="*" element={<NotFound />} />
      <Route path="*" element={<Landing />} />
    </Routes>
    </ErrorBoundary>
  );
}