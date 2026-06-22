import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'

const API = 'http://localhost:5000/api/bookings'

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function StarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function Booking() {
  const location = useLocation()
  const navigate = useNavigate()
  const bookingData = location.state

  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin', { replace: true })
      return
    }

    fetch('http://localhost:5000/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user || !data.user.id_verified) {
          setVerificationError('Your account is not yet verified by admin. Please wait for ID verification approval before booking.')
        }
      })
      .catch(() => {
        navigate('/client/signin', { replace: true })
      })
  }, [navigate])

  if (verificationError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-3">Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">{verificationError}</p>
          <Link
            to="/client/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-charcoal mb-3">No booking data</h1>
          <p className="text-sm text-gray-500 mb-6">Please select a property first.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const { property_id, title, image, location: propLocation, rating, checkIn, checkOut, guests, price, cleaningFee, serviceFee, total } = bookingData
  const totalGuests = guests.adults + guests.children

  async function handleConfirm() {
    if (!paymentMethod) {
      setError('Please select a payment method')
      return
    }

    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: String(property_id),
          check_in: checkIn,
          check_out: checkOut,
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
          total_price: total,
          payment_method: paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess(true)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <CheckIcon className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-3">Booking Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-6">Your booking has been submitted successfully. You can view it in your bookings.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={`/properties/${property_id}`} className="flex items-center gap-3 text-sm font-medium text-charcoal hover:text-sage transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Back to property</span>
          </Link>
          <Link to="/" className="text-lg font-bold tracking-widest uppercase text-teal">TiraNa</Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded p-5 sm:p-6">
              <h2 className="text-base font-bold text-charcoal mb-4">Booking Summary</h2>
              <div className="flex gap-4 mb-4">
                <img
                  src={image}
                  alt={title}
                  className="w-24 h-24 object-cover rounded shrink-0"
                />
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">{title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPinIcon className="w-3 h-3" />
                    {propLocation}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <StarIcon className="w-3 h-3 text-yellow-500" />
                    {rating}
                  </p>
                </div>
              </div>
              <hr className="border-gray-100 mb-4" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-sage shrink-0" />
                  <div>
                    <span className="text-gray-500">Check-in: </span>
                    <span className="font-medium text-charcoal">{new Date(checkIn).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-sage shrink-0" />
                  <div>
                    <span className="text-gray-500">Check-out: </span>
                    <span className="font-medium text-charcoal">{new Date(checkOut).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UsersIcon className="w-4 h-4 text-sage shrink-0" />
                  <div>
                    <span className="text-gray-500">Guests: </span>
                    <span className="font-medium text-charcoal">
                      {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                      {guests.infants > 0 ? `, ${guests.infants} infant${guests.infants > 1 ? 's' : ''}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-5 sm:p-6">
              <h2 className="text-base font-bold text-charcoal mb-4">Select Payment Method</h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="accent-teal w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Cash</p>
                    <p className="text-xs text-gray-500">Pay upon arrival at the property</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-colors ${
                    paymentMethod === 'online'
                      ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="accent-teal w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Online Payment</p>
                    <p className="text-xs text-gray-500">Pay securely via GCash, Maya, or bank transfer</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 px-4 py-3 rounded">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3.5 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>

          <div>
            <div className="bg-white border border-gray-200 rounded p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-base font-bold text-charcoal mb-4">Price Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>₱{price} x {bookingData.nights} night{bookingData.nights > 1 ? 's' : ''}</span>
                  <span>₱{(price * bookingData.nights).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cleaning fee</span>
                  <span>₱{cleaningFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service fee</span>
                  <span>₱{serviceFee.toLocaleString()}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-charcoal">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Booking
