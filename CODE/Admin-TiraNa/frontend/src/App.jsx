import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AcceptInvite from './pages/AcceptInvite'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DashboardHome from './pages/admin/DashboardHome'
import AdminUsers from './pages/admin/AdminUsers'
import AdminListings from './pages/admin/AdminListings'
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
import AdminChangePassword from './pages/admin/AdminChangePassword'


function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          <Route path="/admin" element={<ProtectedRoute />}>
             {/* Routes that don't use the sidebar layout (like force password change) */}
            <Route path="change-password" element={<AdminChangePassword />} />
            
            <Route element={<Layout />}>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
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
