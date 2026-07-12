import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import SignIn from './pages/SignIn'
import VerifyOtp from './pages/VerifyOtp'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DashboardHome from './pages/admin/DashboardHome'
import AdminUsers from './pages/admin/AdminUsers'

import AdminBookings from './pages/admin/AdminBookings'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReviews from './pages/admin/AdminReviews'
import AdminSupport from './pages/admin/AdminSupport'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminWithdrawals from './pages/admin/AdminWithdrawals'
import AdminSettings from './pages/admin/AdminSettings'
import AdminManagement from './pages/admin/AdminManagement'
import AdminAudit from './pages/admin/AdminAudit'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminRooms from './pages/admin/AdminRooms'

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<AdminUsers />} />

              <Route path="rooms" element={<AdminRooms />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  )
}

export default App
