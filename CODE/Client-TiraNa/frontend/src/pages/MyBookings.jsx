import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { HOST_API_URL } from '../api/config.js'

const BOOKING_API = 'http://localhost:5000/api/bookings'
const REVIEW_API = 'http://localhost:5000/api/reviews'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'refund_requested', label: 'Refund Requested' },
  { id: 'refund_completed', label: 'Refund Completed' },
]

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refund_requested: 'bg-purple-50 text-purple-700 border-purple-200',
  refund_completed: 'bg-green-50 text-green-700 border-green-200',
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refund_requested: 'Refund Requested',
  refund_completed: 'Refund Completed',
}

function getDisplayStatus(booking) {
  if (booking.status === 'pending') {
    const now = new Date()
    const checkOut = new Date(booking.check_out)
    if (checkOut < now) return 'cancelled'
  }
  return booking.status
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

function CreditCardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="8" x2="22" y2="8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CancelModal({ booking, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-2">Cancel Booking</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}



function StarIcon({ className, filled }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function StarIconSimple({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function HalfStarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <defs>
        <linearGradient id="halfGradBook">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfGradBook)" />
    </svg>
  )
}

function RatingStars({ rating, size }) {
  const s = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  const stars = []
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  for (let i = 0; i < full; i++) {
    stars.push(<StarIconSimple key={`full-${i}`} className={`${s} text-yellow-500`} />)
  }
  if (hasHalf) {
    stars.push(<HalfStarIcon key="half" className={`${s} text-yellow-500`} />)
  }
  while (stars.length < 5) {
    stars.push(<StarIconSimple key={`empty-${stars.length}`} className={`${s} text-gray-300`} />)
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>
}

const ratingCategories = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'checkIn', label: 'Check-in' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'communication', label: 'Communication' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value' },
]

function CategoryRatingRow({ label, value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-colors bg-transparent border-none cursor-pointer"
          >
            <StarIconSimple
              className={`w-5 h-5 ${(hover || value) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewModal({ booking, propertyTitle, onClose, onSubmit, loading, error }) {
  const [reviewRatings, setReviewRatings] = useState({ accuracy: 0, checkIn: 0, cleanliness: 0, communication: 0, location: 0, value: 0 })
  const [text, setText] = useState('')

  function setCategory(key, value) {
    setReviewRatings(prev => ({ ...prev, [key]: value }))
  }

  const catValues = Object.values(reviewRatings)
  const overallRating = catValues.length > 0
    ? Math.round((catValues.reduce((a, b) => a + b, 0) / catValues.length) * 10) / 10
    : 0
  const hasAllRatings = catValues.every(v => v > 0)

  async function handleSubmit() {
    if (!hasAllRatings) return
    await onSubmit(booking.id, reviewRatings, overallRating, text)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-1">Write a Review</h3>
        <p className="text-sm text-gray-500 mb-5 truncate">{propertyTitle}</p>

        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <span className="text-lg font-semibold text-charcoal">{overallRating || '-'}</span>
          <RatingStars rating={overallRating} size="lg" />
        </div>

        <div className="space-y-3 mb-5">
          {ratingCategories.map(cat => (
            <CategoryRatingRow
              key={cat.key}
              label={cat.label}
              value={reviewRatings[cat.key]}
              onChange={v => setCategory(cat.key, v)}
            />
          ))}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all resize-none mb-4"
        />

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !hasAllRatings}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-sage hover:bg-olive transition-colors disabled:opacity-40"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RefundModal({ booking, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-2">Request Refund</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Would you like to request a refund for this cancelled booking? Our team will review your request.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-teal hover:bg-teal/80 transition-colors disabled:opacity-40"
          >
            {loading ? 'Requesting...' : 'Request Refund'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState({})
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const searchTimeout = useRef(null)

  const [cancelTarget, setCancelTarget] = useState(null)
  const [refundTarget, setRefundTarget] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewError, setReviewError] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewedBookings, setReviewedBookings] = useState(new Set())

  useEffect(() => {
    window.scrollTo(0, 0)
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin')
      return
    }
    loadBookings()
  }, [navigate])

  const loadBookings = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      if (filter !== 'all') params.set('status', filter)

      const res = await fetch(`${BOOKING_API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/client/signin')
          return
        }
        throw new Error('Failed to load bookings')
      }
      const data = await res.json()
      const list = data.data || []
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })

      const ids = [...new Set(list.map(b => b.property_id))]
      const map = {}
      await Promise.all(ids.map(async (pid) => {
        try {
          const pRes = await fetch(`${HOST_API_URL}/api/listings/${pid}`)
          const pData = await pRes.json()
          if (pData.success) {
            map[pid] = pData.data.property
          }
        } catch {}
      }))

      setProperties(map)
      setBookings(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, filter, navigate])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadBookings(1)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [search, filter, loadBookings])

  async function handleCancel(bookingId) {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BOOKING_API}/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCancelTarget(null)
      await loadBookings(pagination.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRefund(bookingId) {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BOOKING_API}/${bookingId}/refund`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRefundTarget(null)
      await loadBookings(pagination.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function loadReviewedBookings(list) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${REVIEW_API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReviewedBookings(new Set((data.data || []).map(r => r.booking_id)))
      }
    } catch {}
  }

  useEffect(() => {
    if (bookings.length > 0) {
      loadReviewedBookings()
    }
  }, [bookings.length])

  async function handleSubmitReview(bookingId, reviewRatings, overallRating, reviewText) {
    setReviewLoading(true)
    setReviewError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(REVIEW_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          rating: overallRating,
          review_text: reviewText,
          accuracy: reviewRatings.accuracy,
          check_in: reviewRatings.checkIn,
          cleanliness: reviewRatings.cleanliness,
          communication: reviewRatings.communication,
          location: reviewRatings.location,
          value: reviewRatings.value,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviewTarget(null)
      setReviewedBookings(prev => new Set([...prev, bookingId]))
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewLoading(false)
    }
  }

  const displayStatus = getDisplayStatus

  function renderActions(booking) {
    const status = displayStatus(booking)
    return (
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => setCancelTarget(booking)}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-red-500 border border-red-200 hover:bg-red-50 transition-colors bg-transparent"
            >
              Cancel
            </button>
          </>
        )}
        {status === 'confirmed' && (
          <button
            type="button"
            onClick={() => setCancelTarget(booking)}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-red-500 border border-red-200 hover:bg-red-50 transition-colors bg-transparent"
          >
            Cancel
          </button>
        )}
        {status === 'completed' && !reviewedBookings.has(booking.id) && (
          <button
            type="button"
            onClick={() => setReviewTarget(booking)}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-sage border border-sage/30 hover:bg-sage/5 transition-colors bg-transparent"
          >
            Write Review
          </button>
        )}
        {status === 'completed' && reviewedBookings.has(booking.id) && (
          <span className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-400 border border-gray-200 bg-gray-50">
            Review Submitted
          </span>
        )}
        {status === 'cancelled' && booking.payment_method === 'online' && (
          <button
            type="button"
            onClick={() => setRefundTarget(booking)}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-teal border border-teal/30 hover:bg-teal/5 transition-colors bg-transparent"
          >
            Request Refund
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-1">
          <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-10 bg-white/10 rounded w-48 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-64 mt-3 animate-pulse" />
            </div>
          </section>
          <section className="py-8 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-10 bg-gray-100 rounded w-full mb-6 animate-pulse" />
              <div className="h-10 bg-gray-100 rounded w-full mb-8 animate-pulse" />
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-56 h-48 sm:h-auto bg-gray-100 animate-pulse shrink-0" />
                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" />
                            <div className="h-3 bg-gray-50 rounded w-1/3 mt-2 animate-pulse" />
                          </div>
                          <div className="h-6 w-20 bg-gray-100 rounded animate-pulse shrink-0" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                              <div>
                                <div className="h-2 bg-gray-50 rounded w-14 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded w-20 mt-1 animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="h-5 bg-gray-100 rounded w-24 animate-pulse" />
                          <div className="h-8 bg-gray-100 rounded w-20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex-1">
      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">My Bookings</h1>
            <p className="text-base text-white/60 mt-2">Manage your property reservations</p>
          </div>
        </div>
      </section>

      <section className="pt-16 sm:pt-20 pb-8 sm:pb-10 -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white border border-gray-100 p-4 mb-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by property ID or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 text-charcoal placeholder-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider whitespace-nowrap transition-colors bg-transparent border-none cursor-pointer ${
                  filter === f.id
                    ? 'text-sage border-b-2 border-sage'
                    : 'text-gray-400 hover:text-charcoal'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1">No bookings found</h3>
              <p className="text-sm text-gray-400 mb-6">
                {search || filter !== 'all'
                  ? 'No bookings match your search or filters.'
                  : "You haven't made any bookings yet."}
              </p>
              {!search && filter === 'all' && (
                <Link
                  to="/properties"
                  className="inline-flex px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
                >
                  Browse Properties
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const prop = properties[booking.property_id]
                const status = displayStatus(booking)
                const adults = Number(booking.adults)
                const children = Number(booking.children)
                const infants = Number(booking.infants)
                const totalGuests = adults + children

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-56 h-48 sm:h-auto shrink-0 bg-gray-100">
                        {prop?.images?.[0] ? (
                          <img
                            src={prop.images[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-5 sm:p-6 flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-charcoal truncate">
                              {prop?.title || `Property #${booking.property_id}`}
                            </h3>
                            {prop?.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPinIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{prop.location}</span>
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider border ${
                              STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            {STATUS_LABELS[status] || status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <CalendarIcon className="w-4 h-4 text-sage shrink-0" />
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Check-in</p>
                              <p className="text-xs font-medium text-charcoal">
                                {formatDate(booking.check_in)}
                              </p>
                              <p className="text-[11px] text-gray-400">{formatTime(booking.check_in)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <CalendarIcon className="w-4 h-4 text-sage shrink-0" />
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Check-out</p>
                              <p className="text-xs font-medium text-charcoal">
                                {formatDate(booking.check_out)}
                              </p>
                              <p className="text-[11px] text-gray-400">{formatTime(booking.check_out)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <UsersIcon className="w-4 h-4 text-sage shrink-0" />
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Guests</p>
                              <p className="text-xs font-medium text-charcoal">
                                {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                                {infants > 0 ? `, ${infants} infant${infants > 1 ? 's' : ''}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-charcoal">
                              ₱{Number(booking.total_price).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <CreditCardIcon className="w-3 h-3" />
                              {booking.payment_method === 'cash' ? 'Cash' : 'Online Payment'}
                            </span>
                          </div>
                          {renderActions(booking)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                type="button"
                onClick={() => loadBookings(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <ChevronLeftIcon />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (pagination.totalPages <= 7) return true
                  if (p === 1 || p === pagination.totalPages) return true
                  if (Math.abs(p - pagination.page) <= 1) return true
                  return false
                })
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">...</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => loadBookings(p)}
                      className={`w-9 h-9 text-sm font-medium transition-colors border cursor-pointer ${
                        p === pagination.page
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'bg-transparent text-charcoal border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                type="button"
                onClick={() => loadBookings(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>
      </section>

      </div>

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => handleCancel(cancelTarget.id)}
          loading={actionLoading}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          propertyTitle={properties[reviewTarget.property_id]?.title || `Property #${reviewTarget.property_id}`}
          onClose={() => { setReviewTarget(null); setReviewError('') }}
          onSubmit={handleSubmitReview}
          loading={reviewLoading}
          error={reviewError}
        />
      )}

      {refundTarget && (
        <RefundModal
          booking={refundTarget}
          onClose={() => setRefundTarget(null)}
          onConfirm={() => handleRefund(refundTarget.id)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

export default MyBookings
