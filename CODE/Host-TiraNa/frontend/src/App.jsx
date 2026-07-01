import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import { ToastProvider } from './components/common/Toast'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import PropertyManagement from './pages/properties/PropertyManagement'
import AddEditProperty from './pages/properties/AddEditProperty'
import BookingsPage from './pages/bookings/BookingsPage'
import GuestManagement from './pages/guests/GuestManagement'
import ReviewsPage from './pages/reviews/ReviewsPage'
import RevenuePage from './pages/revenue/RevenuePage'
import NotificationsPage from './pages/notifications/NotificationsPage'
{/*import NotificationsPage from './pages/notifications/NotificationsPage'*/}
import SettingsPage from './pages/settings/SettingsPage'

// sessionStorage key used to mark "the last navigation came from inside
// the app, via handleNavigate" — see RequireInternalNav below. Cleared
// the moment it's read, so it can't be replayed by refresh/back-button/
// typing the URL again.
const INTERNAL_NAV_KEY = "auth_internal_nav"

/**
 * If a host is already logged in, skip the public auth pages and go
 * straight to the dashboard. Also covers the inverse of ProtectedRoute.
 */
function GuestOnlyRoute({ children }) {
  const token = localStorage.getItem("access_token")
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

/**
 * Guards verify-email / forgot-password / reset-password from being
 * opened by typing the URL directly. These pages only make sense as a
 * step reached from inside the app (sign up -> verify-email, sign in ->
 * forgot-password -> reset-password). handleNavigate() below sets a
 * one-time sessionStorage flag right before routing to one of these
 * pages; this wrapper requires that flag to be present and consumes it
 * synchronously inside the useState initializer — running exactly once
 * per mount, which avoids the React Strict Mode double-invoke race
 * condition where the async useEffect approach cleared the flag on the
 * first (discarded) render before the second render's effect could see it,
 * causing a spurious redirect to /signin instead of showing the page.
 */
function RequireInternalNav({ children }) {
  const location = useLocation()

  // Read + clear the flag synchronously during the first render.
  // useState initializer runs once per mount, so the flag is consumed
  // exactly once regardless of Strict Mode double-invocation.
  const [allowed] = useState(() => {
    const flag = sessionStorage.getItem(INTERNAL_NAV_KEY)
    if (flag === location.pathname) {
      sessionStorage.removeItem(INTERNAL_NAV_KEY)
      return true
    }
    return false
  })

  if (!allowed) return <Navigate to="/signin" replace />
  return children
}

/**
 * Maps the `onNavigate(page, params)` calls used inside the auth pages
 * to real React Router navigation. `params` (e.g. { email }) is passed
 * along as route state so the destination page can read it.
 */
function AuthRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  const GUARDED_PAGES = ["verify-email", "forgot-password", "reset-password"]

  const handleNavigate = (page, params = {}) => {
    if (GUARDED_PAGES.includes(page)) {
      sessionStorage.setItem(INTERNAL_NAV_KEY, `/${page}`)
    }
    navigate(`/${page}`, { state: params })
  }

  const state = location.state || {}

  return (
    <Routes>
      <Route path="/signin" element={<GuestOnlyRoute><SignIn onNavigate={handleNavigate} /></GuestOnlyRoute>} />
      <Route path="/signup" element={<GuestOnlyRoute><SignUp onNavigate={handleNavigate} /></GuestOnlyRoute>} />
      <Route
        path="/verify-email"
        element={
          <RequireInternalNav>
            <VerifyEmail onNavigate={handleNavigate} email={state.email || "you@example.com"} />
          </RequireInternalNav>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RequireInternalNav>
            <ForgotPassword onNavigate={handleNavigate} />
          </RequireInternalNav>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RequireInternalNav>
            <ResetPassword onNavigate={handleNavigate} email={state.email || ""} />
          </RequireInternalNav>
        }
      />

      {/* Default route */}
      <Route path="/" element={<Navigate to="/signin" replace />} />

      {/* Dashboard routes — require a valid login session */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="properties" element={<PropertyManagement />} />
        <Route path="properties/new" element={<AddEditProperty />} />
        <Route path="properties/:id/edit" element={<AddEditProperty />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="guests" element={<GuestManagement />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {/* <Route path="notifications" element={<NotificationsPage />} /> */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Anything unrecognized falls back to sign-in */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthRoutes />
      </ToastProvider>
    </Router>
  )
}

export default App