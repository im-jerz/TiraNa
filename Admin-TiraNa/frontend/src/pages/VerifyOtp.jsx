import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import logo from '../assets/logo.png'

export default function VerifyOtp() {
  const { verify, pendingOtp } = useAdminAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!pendingOtp) {
    navigate('/signin', { replace: true })
    return null
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
      setCode(newCode)
      const lastFilled = Math.min(pasted.length, 6) - 1
      const nextInput = document.getElementById(`otp-${Math.min(lastFilled + 1, 5)}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    setLoading(true)
    try {
      await verify(fullCode)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="TiraNa Logo" />
          <h1>TiraNa <span>Admin</span></h1>
        </div>
        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{pendingOtp.email}</strong>. Enter it below to continue.
        </p>

        {error && (
          <div className="alert-strip alert-danger" style={{ marginBottom: 16 }}>
            <div className="alert-strip-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="alert-strip-content"><p>{error}</p></div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-input-group" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-brand auth-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
