import { useState } from 'react'
import { Link } from 'react-router-dom'
import VerifyModal from '../components/VerifyModal.jsx'

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

function MailIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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

function Signup() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(form.email)) {
      setError('Please use a valid Gmail address (example@gmail.com)')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number')
      return
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError('Password must contain at least one symbol')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setPendingEmail(form.email)
      setShowModal(true)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleVerified() {
    setShowModal(false)
    setPendingEmail('')
    setForm({ username: '', email: '', password: '', confirmPassword: '' })
    setError('')
  }

  function handleModalClose() {
    setShowModal(false)
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
                Start your journey
              </h2>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                Gumawa ng account at tumuklas ng mga kakaibang accommodation sa Pilipinas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Browse thousands of unique properties
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Book with confidence and ease
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Pinagkakatiwalaan ng mga travelers sa buong Pilipinas
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
            <Link to="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Link>
          </div>

          <div className="mb-8">
            <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors mb-6">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Link>
            <h1 className="text-2xl font-bold text-charcoal">Create your account</h1>
            <p className="text-sm text-gray-400 mt-1.5">Mag-sign up para magsimulang mag-book ng mga kakaibang accommodation sa Pilipinas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <UserIcon />
                </span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                  placeholder="your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                  placeholder={`example@gmail.com`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
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
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
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

            {pendingEmail && !showModal && (
              <div className="bg-teal/5 border border-teal/10 px-4 py-3">
                <p className="text-xs text-teal-700">
                  Verification pending for{' '}
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="font-medium underline hover:text-olive transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    {pendingEmail}
                  </button>
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white py-3 text-sm font-medium tracking-wide hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 text-center">
              Already have an account?{' '}
              <Link to="/client/signin" className="text-teal font-medium hover:text-olive transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-[11px] text-gray-300 text-center mt-5 leading-relaxed">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-gray-400 hover:text-charcoal underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-gray-400 hover:text-charcoal underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {showModal && (
        <VerifyModal
          email={pendingEmail}
          onVerified={handleVerified}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default Signup
