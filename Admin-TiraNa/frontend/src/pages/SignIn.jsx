import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import logo from '../assets/logo.png'

export default function SignIn() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.requiresOtp) {
        navigate('/verify-otp')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left - brand panel (hidden on small screens) */}
      <div className="auth-brand">
        <div className="auth-brand-bg" />
        <div className="auth-brand-grid" />
        <div className="auth-brand-accent" />

        <div className="auth-brand-logo">
          <div className="auth-brand-icon">
            <img src={logo} alt="TiraNa Logo" />
          </div>
          <p className="auth-brand-name">TiraNa <span>Admin</span></p>
        </div>

        <div className="auth-brand-tagline">
          <h2>Oversight, without the <span>guesswork</span>.</h2>
          <p>Track listings, bookings, and payouts across TiraNa, and manage every account from one console built for the ops team.</p>

          <div className="auth-brand-stats">
            <div className="auth-brand-stat">
              <p>Listings</p>
              <p>Approvals &amp; audits</p>
            </div>
            <div className="auth-brand-stat">
              <p>Bookings</p>
              <p>Disputes &amp; payouts</p>
            </div>
            <div className="auth-brand-stat">
              <p>Accounts</p>
              <p>Roles &amp; access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - form panel */}
      <div className="auth-form-panel">
        <div className="auth-mobile-logo">
          <div className="auth-mobile-logo-icon">
            <img src={logo} alt="TiraNa Logo" />
          </div>
          <span>TiraNa <em>Admin</em></span>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Sign in</h1>
            <p className="auth-form-sub">Enter your credentials to access the admin console.</p>
          </div>

          <div className={`auth-error${error ? ' show' : ''}`}>{error}</div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <div className="field-wrap">
                <input
                  type="email"
                  className="field-input"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input pr"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m3.11-2.548A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.132 5.411M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Keep me signed in on this device</label>
            </div>

            <button type="submit" className="btn-auth" style={{ marginTop: '1.4rem' }} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="auth-footer-note">Restricted access · Authorized TiraNa personnel only</p>
      </div>
    </div>
  )
}
