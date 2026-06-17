import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

/**
 * Maps the `onNavigate(page, params)` calls used inside the auth pages
 * to real React Router navigation. `params` (e.g. { email }) is passed
 * along as route state so the destination page can read it.
 */
function AuthRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (page, params = {}) => {
    navigate(`/${page}`, { state: params })
  }

  const state = location.state || {}

  return (
    <Routes>
      <Route path="/signin" element={<SignIn onNavigate={handleNavigate} />} />
      <Route path="/signup" element={<SignUp onNavigate={handleNavigate} />} />
      <Route
        path="/verify-email"
        element={<VerifyEmail onNavigate={handleNavigate} email={state.email || "you@example.com"} />}
      />
      <Route path="/forgot-password" element={<ForgotPassword onNavigate={handleNavigate} />} />
      <Route
        path="/reset-password"
        element={<ResetPassword onNavigate={handleNavigate} email={state.email || ""} />}
      />

      {/* Default route */}
      <Route path="/" element={<Navigate to="/signin" replace />} />

      {/* Dashboard route (protected later) */}
      <Route path="/dashboard" element={
        <div style={{ padding: "2rem" }}>
          <h1>Dashboard</h1>
          <p>This will be your protected dashboard after login</p>
          <button onClick={() => {
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            localStorage.removeItem("host")
            navigate("/signin")
          }}>
            Sign Out
          </button>
        </div>
      } />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthRoutes />
    </Router>
  )
}

export default App
