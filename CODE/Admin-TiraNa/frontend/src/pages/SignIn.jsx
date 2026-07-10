import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getPublicStats } from '../api/admin'
import logo from '../assets/logo.png'

function SignIn() {
  const { login, verifyOtp, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [stats, setStats] = useState(null)

  useEffect(() => {
    getPublicStats().then(setStats).catch(() => {})
  }, [])

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

  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [otpEmail, setOtpEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      if (data.requires_otp) {
        setRequiresOtp(true)
        setTempToken(data.temp_token)
        setOtpEmail(data.admin?.email || form.username)
      }
    } catch (err) {
      setError(err.message || 'Sign in failed')
    }
    setLoading(false)
  }

  const handleOtpCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...otpCode]
    newCode[index] = value.slice(-1)
    setOtpCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setOtpCode(newCode)
    const lastIndex = Math.min(pasted.length, 5)
    const lastInput = document.getElementById(`otp-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  const handleOtpSubmit = async () => {
    setOtpError('')
    setOtpLoading(true)
    const code = otpCode.join('')
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits')
      setOtpLoading(false)
      return
    }
    try {
      const data = await verifyOtp(otpEmail, code, tempToken)
      if (data.admin?.password_changed === false) {
        navigate('/admin/change-password')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed')
    }
    setOtpLoading(false)
  }

  const backToLogin = () => {
    setRequiresOtp(false)
    setOtpCode(['', '', '', '', '', ''])
    setOtpError('')
    setTempToken('')
    setOtpEmail('')
  }

  if (requiresOtp) {
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
            <h2>Secure your<br />account with <span>2FA.</span></h2>
            <p>Enter the one-time verification code sent to your email to continue.</p>
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
              <div className="auth-form-title">Verify your identity</div>
              <div className="auth-form-sub">Check your email for the 6-digit verification code.</div>
            </div>
            <div id="auth-error" className={`auth-error ${otpError ? 'show' : ''}`}>{otpError}</div>
            <p className="otp-hint">We sent a 6-digit code to <strong>{otpEmail}</strong>. Enter it below to continue.</p>
            <div className="field-group">
              <label className="field-label">Verification Code</label>
              <div style={{display:'flex',justifyContent:'center',gap:8}}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="field-input otp-input"
                    style={{width:48,height:56,textAlign:'center',fontSize:24,letterSpacing:0}}
                  />
                ))}
              </div>
            </div>
            <button className="btn-auth" onClick={handleOtpSubmit} disabled={otpLoading}>
              {otpLoading ? <div className="spinner" /> : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              Verify Code
            </button>
            <button className="btn-back" onClick={backToLogin}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to login
            </button>
          </div>
          <div className="auth-footer-note">© 2025 TiraNa. All rights reserved.</div>
        </div>
      </div>
    )
  }

  return (
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
          <h2>Manage your<br />platform with <span>confidence.</span></h2>
          <p>A complete admin suite to oversee users, bookings, payments, and platform health — all in one place.</p>
            <div className="auth-brand-stats">
              <div className="auth-brand-stat"><p>{fmtNum(stats?.total_users)}</p><p>Total Users</p></div>
              <div className="auth-brand-stat"><p>{fmtNum(stats?.total_bookings)}</p><p>Bookings</p></div>
              <div className="auth-brand-stat"><p>{fmtRevenue(stats?.total_revenue)}</p><p>Revenue</p></div>
            </div>
          </div>
        </div>

      <div className="auth-form-panel">
        <div className="auth-mobile-logo">
          <div className="auth-mobile-logo-icon">
            <img src={logo} alt="TiraNa Logo" />
          </div>
          <span>TiraNa <em>Admin</em></span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <div className="auth-form-title" id="login-title">Welcome back</div>
            <div className="auth-form-sub" id="login-subtitle">Sign in to access the admin dashboard.</div>
          </div>

          <div className={`auth-error ${error ? 'show' : ''}`}>{error}</div>

          <form onSubmit={handleSignIn}>
            <div className="field-group">
              <label className="field-label">Username or Email</label>
              <input className="field-input" type="text" placeholder="admin@tirana.ph" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoComplete="username" />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <input className="field-input pr" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
                <button type="button" className="field-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',margin:'-6px 0 14px'}}>
              <button type="button" style={{background:'none',border:'none',color:'#6b7280',fontSize:12,cursor:'pointer'}}>Forgot password?</button>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <div className="spinner" /> : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
              Sign In to Dashboard
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/signup"><button type="button">Create admin account</button></Link>
          </div>
        </div>
        <div className="auth-footer-note">© 2025 TiraNa. All rights reserved.</div>
      </div>
    </div>
  )
}

export default SignIn
