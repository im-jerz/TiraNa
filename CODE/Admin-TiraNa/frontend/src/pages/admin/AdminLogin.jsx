import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLogin() {
  const { login, verifyOtp, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // OTP State
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      if (data.requires_otp) {
        setRequiresOtp(true)
        setTempToken(data.temp_token)
        setEmail(data.admin?.email || form.username) // Fallback if admin info isn't returned yet
      } else {
        if (data.admin?.password_changed === false) {
           navigate('/admin/change-password')
        } else {
           navigate('/admin')
        }
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await verifyOtp(email, otpCode, tempToken)
      if (data.admin?.password_changed === false) {
        navigate('/admin/change-password')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-gray-light mt-2">
            {requiresOtp ? 'Enter the 6-digit code sent to your email' : 'Sign in to the admin panel'}
          </p>
        </div>

        <div className="bg-dark backdrop-blur-sm rounded-2xl p-8 border border-gray-light shadow-xl">
          {error && (
            <div className="p-3 mb-5 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm text-center">
              {error}
            </div>
          )}

          {!requiresOtp ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Username / Email</label>
                <input
                  type="text"
                  placeholder="Enter admin username or email"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 pr-12 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-dark">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand hover:bg-brand/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">OTP Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark text-center text-2xl tracking-widest transition-all"
                  required
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand hover:bg-brand/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setRequiresOtp(false)}
                className="w-full text-sm text-gray-light hover:text-white transition-colors"
              >
                Back to login
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/signin" className="text-gray-light text-sm hover:text-dark transition-colors">
              Back to user sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
