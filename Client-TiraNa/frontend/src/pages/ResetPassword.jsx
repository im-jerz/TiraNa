import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function EyeIcon({ open }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {open ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      )}
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  )
}

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const inputsRef = useRef([])
  const timerRef = useRef(null)

  const [digits, setDigits] = useState(Array(6).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  function handleDigitChange(index, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError('')
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputsRef.current[5]?.focus()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const code = digits.join('')
    if (code.length !== 6) {
      setError('Enter the full 6-digit code')
      return
    }

    if (!newPassword) {
      setError('Enter a new password')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      navigate('/client/signin')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setResent(false)

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setResent(true)
      setDigits(Array(6).fill(''))
      setCooldown(60)
      inputsRef.current[0]?.focus()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-4">Missing email</h1>
          <p className="text-sm text-gray-400 mb-6">No email was provided. Please start again.</p>
          <Link
            to="/client/forgot-password"
            className="inline-block bg-teal text-white px-6 py-3 text-sm font-medium tracking-wide hover:bg-olive transition-colors"
          >
            Back to forgot password
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1200&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal/80 via-teal/60 to-charcoal/90" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <Link to="/" className="text-lg font-bold tracking-[0.2em] uppercase text-white/90 hover:text-white transition-colors w-fit">
            TiraNa
          </Link>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white leading-tight">
                Reset your password
              </h2>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                Enter the code from your email and choose a new password.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Check your email for the 6-digit code
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Code expires in 15 minutes
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create a strong, unique password
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold tracking-[0.2em] uppercase text-teal hover:text-olive transition-colors">
              TiraNa
            </Link>
            <Link to="/client/forgot-password" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors">
              <ArrowLeftIcon />
              Back
            </Link>
          </div>

          <div className="mb-8">
            <Link to="/client/forgot-password" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors mb-6">
              <ArrowLeftIcon />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-charcoal">Reset password</h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Enter the code sent to{' '}
              <span className="text-charcoal font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-3">
                Verification code
              </label>
              <div className="flex gap-2 justify-center">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-10 h-12 border text-center text-lg font-bold transition-all focus:outline-none focus:ring-1 ${
                      d
                        ? 'border-teal text-teal ring-1 ring-teal/20'
                        : 'border-gray-200 text-charcoal focus:border-teal focus:ring-teal/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="newPassword">
                New password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-charcoal transition-colors bg-transparent border-none p-0 cursor-pointer"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-charcoal transition-colors bg-transparent border-none p-0 cursor-pointer"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {resent && (
              <div className="bg-teal/5 border border-teal/10 px-4 py-3">
                <p className="text-xs text-teal-700">A new code has been sent.</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white py-3 text-sm font-medium tracking-wide hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="text-center mt-5">
            <p className="text-xs text-gray-400">
              Did not receive it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-teal font-medium hover:text-olive transition-colors bg-transparent border-none p-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend code'}
              </button>
            </p>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 text-center">
              Remember your password?{' '}
              <Link to="/client/signin" className="text-teal font-medium hover:text-olive transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
