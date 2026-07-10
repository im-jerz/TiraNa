import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvite, getPublicStats } from '../api/admin'
import logo from '../assets/logo.png'

function AcceptInvite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || '',
    password: '',
    confirmPassword: ''
  })
  
  const [stats, setStats] = useState(null)

  useEffect(() => { getPublicStats().then(setStats).catch(() => {}) }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await acceptInvite(form.email, form.code, form.password)
      setSuccess('Invitation accepted! You can now log in.')
      setTimeout(() => navigate('/signin'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to accept invitation')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page active">
      <div className="auth-brand">
        <div className="auth-brand-bg"></div>
        <div className="auth-brand-grid"></div>
        <div className="auth-brand-accent"></div>
        <div className="auth-brand-logo">
          <div className="auth-brand-icon"><img src={logo} alt="TiraNa Logo" /></div>
          <div className="auth-brand-name">TiraNa <span>Admin</span></div>
        </div>
        <div className="auth-brand-tagline">
          <h2>Join the<br /><span>TiraNa</span> admin team.</h2>
          <p>Set your password to activate your admin account and start managing the platform.</p>
          <div className="auth-brand-stats">
              <div className="auth-brand-stat"><p>{stats?.active_admins ?? '0'}</p><p>Active Admins</p></div>
              <div className="auth-brand-stat"><p>{stats?.total_admins ?? '0'}</p><p>Total Admins</p></div>
              <div className="auth-brand-stat"><p>24/7</p><p>Monitoring</p></div>
          </div>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-mobile-logo">
          <div className="auth-mobile-logo-icon"><img src={logo} alt="TiraNa Logo" /></div>
          <span>TiraNa <em>Admin</em></span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <div className="auth-form-title">Accept Invitation</div>
            <div className="auth-form-sub">Set your password to activate your admin account</div>
          </div>
          <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>
          <div className={`auth-success ${success ? 'show' : ''}`}>{success}</div>
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input className="field-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field-group">
                <label className="field-label">Invitation Code</label>
                <input className="field-input" type="text" placeholder="6-digit code from email" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>
              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="field-wrap">
                  <input className="field-input pr" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" className="field-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <div className="field-wrap">
                  <input className="field-input pr" type={showConfirm ? 'text' : 'password'} placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                  <button type="button" className="field-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <div className="spinner" /> : null}
                Activate Account
              </button>
            </form>
          )}
        </div>
        <div className="auth-footer-note">© 2025 TiraNa. All rights reserved.</div>
      </div>
    </div>
  )
}

export default AcceptInvite
