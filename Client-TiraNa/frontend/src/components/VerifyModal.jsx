import { useState, useRef, useEffect } from 'react'

function MailIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function VerifyModal({ email, onVerified, onClose }) {
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)
  const inputsRef = useRef([])

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

  function handleChange(index, value) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    const code = digits.join('')

    if (code.length !== 6) {
      setError('Enter the full 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      onVerified()
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
      const res = await fetch('http://localhost:5000/api/auth/resend-code', {
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
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setResending(false)
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-sm relative">
        <div className="h-1.5 bg-gradient-to-r from-sage via-teal to-charcoal" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-charcoal hover:bg-gray-50 transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="px-8 pt-10 pb-8">
          <div className="w-12 h-12 rounded-full bg-teal/5 flex items-center justify-center mx-auto mb-4">
            <MailIcon />
          </div>

          <h2 className="text-xl font-bold text-charcoal text-center mb-2">
            Verify your email
          </h2>

          <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
            Enter the 6-digit code sent to<br />
            <span className="text-charcoal font-medium">{email}</span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
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

            {error && (
              <div className="bg-red-50 border border-red-100 px-4 py-3 mb-4">
                <p className="text-xs text-red-600 text-center">{error}</p>
              </div>
            )}

            {resent && (
              <div className="bg-teal/5 border border-teal/10 px-4 py-3 mb-4">
                <p className="text-xs text-teal-700 text-center">A new code has been sent.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white py-3 text-sm font-medium tracking-wide hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-xs text-gray-400">
              Didn't receive it?{' '}
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
        </div>
      </div>
    </div>
  )
}

export default VerifyModal
