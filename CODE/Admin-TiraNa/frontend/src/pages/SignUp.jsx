import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminRegister, adminRegisterVerify, getPublicStats } from '../api/admin'
import logo from '../assets/logo.png'

function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [stats, setStats] = useState(null)

  useEffect(() => { getPublicStats().then(setStats).catch(() => {}) }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)

  const checkStrength = (val) => {
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    setPasswordScore(val ? score : 0)
  }

  const levels = [
    { pct: '25%', color: '#dc2626', label: 'Weak' },
    { pct: '50%', color: '#d97706', label: 'Fair' },
    { pct: '75%', color: '#2563eb', label: 'Good' },
    { pct: '100%', color: '#16a34a', label: 'Strong' },
  ]

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const data = await adminRegister(form.username, form.email, form.password)
      setVerifyEmail(form.email)
      setShowModal(true)
      setForm({ username: '', email: '', password: '', confirmPassword: '' })
      setPasswordScore(0)
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...verifyCode]
    newCode[index] = value.slice(-1)
    setVerifyCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setVerifyCode(newCode)
    const lastIndex = Math.min(pasted.length, 5)
    const lastInput = document.getElementById(`code-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  const handleVerify = async () => {
    setVerifyError('')
    setVerifyLoading(true)
    const code = verifyCode.join('')
    if (code.length !== 6) {
      setVerifyError('Please enter all 6 digits')
      setVerifyLoading(false)
      return
    }
    try {
      await adminRegisterVerify(verifyEmail, code)
      setShowModal(false)
      setVerifyCode(['', '', '', '', '', ''])
      setSuccess(true)
      setTimeout(() => { navigate('/signin') }, 2000)
    } catch (err) {
      setVerifyError(err.message || 'Verification failed')
    }
    setVerifyLoading(false)
  }

  return (
    <>
      <div className="auth-page active">
        <div className="auth-brand">
          <div className="auth-brand-bg"></div>
          <div className="auth-brand-grid"></div>
          <div className="auth-brand-accent"></div>
          <div className="auth-brand-logo">
            <div className="auth-brand-icon">
              <img src={logo} alt="TiraNa Logo" />
            </div>
            <div className="auth-brand-name">TiraNa <span>Admin</span></div>
          </div>
          <div className="auth-brand-tagline">
            <h2>Join the<br /><span>TiraNa</span> admin<br />team.</h2>
            <p>Create your administrator account to start managing the platform. All accounts require approval from a Super Admin.</p>
            <div className="auth-brand-stats">
              <div className="auth-brand-stat"><p>{stats?.active_admins ?? '0'}</p><p>Active Admins</p></div>
              <div className="auth-brand-stat"><p>{stats?.total_admins ?? '0'}</p><p>Total Admins</p></div>
              <div className="auth-brand-stat"><p>24/7</p><p>Monitoring</p></div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel" style={{ overflowY: 'auto' }}>
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">
              <img src={logo} alt="TiraNa Logo" />
            </div>
            <span>TiraNa <em>Admin</em></span>
          </div>
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <div className="auth-form-title">Create account</div>
              <div className="auth-form-sub">Fill in your details to request admin access.</div>
            </div>

            <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>
            <div className={`auth-success ${success ? 'show' : ''}`}>
              ✓ Account verified successfully! Redirecting to sign in...
            </div>

            {!success && (
              <form onSubmit={handleSignup}>
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input className="field-input" type="text" placeholder="Juan Dela Cruz" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoComplete="name" />
                </div>
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input className="field-input" type="email" placeholder="juan@tirana.ph" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="field-wrap">
                    <input className="field-input pr" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); checkStrength(e.target.value) }} required />
                    <button type="button" className="field-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  {form.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div className="strength-fill" style={{ width: passwordScore > 0 ? levels[passwordScore - 1].pct : '0%', background: passwordScore > 0 ? levels[passwordScore - 1].color : '' }} />
                      </div>
                      <div className="strength-text" style={{ color: passwordScore > 0 ? levels[passwordScore - 1].color : '' }}>
                        Strength: {passwordScore > 0 ? levels[passwordScore - 1].label : ''}
                      </div>
                    </div>
                  )}
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="field-wrap">
                    <input className="field-input pr" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                    <button type="button" className="field-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="field-group">
                  <div className="checkbox-group">
                    <input type="checkbox" id="reg-terms" required />
                    <label htmlFor="reg-terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and understand my access is subject to Super Admin approval.</label>
                  </div>
                </div>
                <button type="submit" className="btn-auth" disabled={loading}>
                  {loading ? <div className="spinner" /> : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                  Submit Registration
                </button>
              </form>
            )}

            {!success && (
              <div className="auth-switch">
                Already have an account? <Link to="/signin"><button type="button">Sign in</button></Link>
              </div>
            )}
          </div>
          <div className="auth-footer-note">© 2025 TiraNa. All rights reserved.</div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Verify Your Email</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setVerifyCode(['', '', '', '', '', '']); setVerifyError('') }}>✕</button>
            </div>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              We sent a 6-digit code to<br /><strong style={{ color: '#374151' }}>{verifyEmail}</strong>
            </p>
            {verifyError && <div className="form-error show" style={{ textAlign: 'center', marginBottom: 12 }}>{verifyError}</div>}
            <div className="field-group">
              <label className="form-label">Verification Code</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {verifyCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="form-input"
                    style={{ width: 48, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
                  />
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); setVerifyCode(['', '', '', '', '', '']); setVerifyError('') }}>Cancel</button>
              <button className="btn btn-brand" onClick={handleVerify} disabled={verifyLoading}>
                {verifyLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SignUp
