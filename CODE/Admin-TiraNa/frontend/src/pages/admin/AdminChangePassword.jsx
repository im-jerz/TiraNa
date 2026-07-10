import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, getPublicStats } from '../../api/admin'
import { useAdminAuth } from '../../context/AdminAuthContext'
import logo from '../../assets/logo.png'

export default function AdminChangePassword() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  useEffect(() => { getPublicStats().then(setStats).catch(() => {}) }, [])

  const fmtNum = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    return n.toLocaleString()
  }

  const fmtRevenue = (n) => {
    if (!n) return '₱0'
    if (n >= 1000000) return '₱' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    return '₱' + Number(n).toLocaleString()
  }

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match')
    }
    if (form.newPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setSuccess(true)
      setTimeout(() => { logout(); navigate('/signin') }, 2000)
    } catch (err) {
      setError(err.message)
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
          <h2>Keep your<br />account <span>secure.</span></h2>
          <p>Change your password regularly to protect your admin account from unauthorized access.</p>
            <div className="auth-brand-stats">
              <div className="auth-brand-stat"><p>{fmtNum(stats?.total_users)}</p><p>Total Users</p></div>
              <div className="auth-brand-stat"><p>{fmtNum(stats?.total_bookings)}</p><p>Bookings</p></div>
              <div className="auth-brand-stat"><p>{fmtRevenue(stats?.total_revenue)}</p><p>Revenue</p></div>
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
            <div className="auth-form-title">Change Password</div>
            <div className="auth-form-sub">Update your password to secure your account</div>
          </div>
          <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>
          <div className={`auth-success ${success ? 'show' : ''}`}>
            Password changed successfully! Redirecting to login...
          </div>
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Current Password</label>
                <div className="field-wrap">
                  <input className="field-input pr" type={showCurrent ? 'text' : 'password'} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
                  <button type="button" className="field-eye" onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                    {showCurrent ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="field-wrap">
                  <input className="field-input pr" type={showNew ? 'text' : 'password'} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
                  <button type="button" className="field-eye" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                    {showNew ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="field-wrap">
                  <input className="field-input pr" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
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
                Update Password
              </button>
            </form>
          )}
        </div>
        <div className="auth-footer-note">© 2025 TiraNa. All rights reserved.</div>
      </div>
    </div>
  )
}
