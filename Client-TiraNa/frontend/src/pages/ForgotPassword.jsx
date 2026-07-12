import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function MailIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

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

      navigate(`/client/reset-password?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
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
                Forgot password?
              </h2>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                No worries. Enter your email and we will send you a reset code.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Fast and secure password reset
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                6-digit code sent to your inbox
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to booking in minutes
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
            <Link to="/client/signin" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors">
              <ArrowLeftIcon />
              Back
            </Link>
          </div>

          <div className="mb-8">
            <Link to="/client/signin" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-charcoal transition-colors mb-6">
              <ArrowLeftIcon />
              Back to sign in
            </Link>
            <h1 className="text-2xl font-bold text-charcoal">Forgot password</h1>
            <p className="text-sm text-gray-400 mt-1.5">Enter your email and we will send you a reset code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                  placeholder="your email address"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white py-3 text-sm font-medium tracking-wide hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </div>
          </form>

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

export default ForgotPassword
