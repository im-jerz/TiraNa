import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { HOST_API_URL, CLIENT_API } from '../api/config.js'

const REVIEW_API = `${CLIENT_API}/reviews`

function computeAvg(review) {
  const cats = ['accuracy', 'checkIn', 'cleanliness', 'communication', 'location', 'value']
  const vals = cats.map(k => Number(review[k])).filter(v => v > 0)
  return vals.length > 0
    ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    : Number(review.rating)
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StarIcon({ className }) {
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
        <linearGradient id="halfGradRev">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfGradRev)" />
    </svg>
  )
}

function StarRating({ rating, size }) {
  const s = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  const stars = []
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  for (let i = 0; i < full; i++) {
    stars.push(<StarIcon key={`full-${i}`} className={`${s} text-yellow-400`} />)
  }
  if (hasHalf) {
    stars.push(<HalfStarIcon key="half" className={`${s} text-yellow-400`} />)
  }
  while (stars.length < 5) {
    stars.push(<StarIcon key={`empty-${stars.length}`} className={`${s} text-gray-200`} />)
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>
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
            <StarIcon
              className={`w-5 h-5 ${(hover || value) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function EditReviewModal({ review, propertyTitle, onClose, onSubmit, loading, error }) {
  const [editRatings, setEditRatings] = useState({
    accuracy: Number(review.accuracy) || 0,
    checkIn: Number(review.check_in) || 0,
    cleanliness: Number(review.cleanliness) || 0,
    communication: Number(review.communication) || 0,
    location: Number(review.location) || 0,
    value: Number(review.value) || 0,
  })
  const [text, setText] = useState(review.review_text || '')

  async function handleSubmit() {
    const hasRating = Object.values(editRatings).some(v => Number(v) > 0)
    if (!hasRating) return
    const catValues = Object.values(editRatings).map(Number).filter(v => v > 0)
    const overallRating = Math.round((catValues.reduce((a, b) => a + b, 0) / catValues.length) * 10) / 10
    await onSubmit(review.id, overallRating, text, editRatings)
  }

  const vals = Object.values(editRatings).map(Number).filter(v => v > 0)
  const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-1">Edit Review</h3>
        <p className="text-sm text-gray-400 mb-5 truncate">{propertyTitle}</p>

        <div className="mb-5 space-y-3">
          {ratingCategories.map(cat => (
            <CategoryRatingRow
              key={cat.key}
              label={cat.label}
              value={editRatings[cat.key]}
              onChange={(val) => setEditRatings(prev => ({ ...prev, [cat.key]: val }))}
            />
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500">Overall:</span>
            <StarRating rating={avg} size="sm" />
            <span className="text-xs text-gray-400 ml-1">{avg > 0 ? avg.toFixed(1) : ''}</span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-200 text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 rounded-xl transition-all resize-none mb-4"
        />

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-all rounded-xl bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || Object.values(editRatings).every(v => Number(v) === 0)}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-charcoal hover:bg-charcoal/90 transition-all rounded-xl disabled:opacity-40"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteReviewModal({ onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 mx-auto">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-charcoal mb-2 text-center">Delete Review</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed text-center">
          Are you sure you want to delete this review? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-all rounded-xl bg-transparent"
          >
            Keep Review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all rounded-xl disabled:opacity-40"
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-5 h-5 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
      <div className="mb-5">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mt-2" />
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <div className="w-11 h-11 bg-gray-100 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3 mt-1" />
        </div>
      </div>
    </div>
  )
}

function Reviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [properties, setProperties] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const searchTimeout = useRef(null)

  const [editTarget, setEditTarget] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const stats = useMemo(() => {
    if (reviews.length === 0) return null
    const ratings = reviews.map(r => computeAvg(r))
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach(r => {
      const key = Math.floor(r)
      if (key >= 1 && key <= 5) dist[key]++
    })
    return { avg: Math.round(avg * 10) / 10, total: ratings.length, dist }
  }, [reviews])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin')
      return
    }
    loadReviews()
  }, [navigate])

  const loadReviews = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      if (ratingFilter === '5') { params.set('min_rating', '5'); params.set('max_rating', '5') }
      else if (ratingFilter === '4') { params.set('min_rating', '4'); params.set('max_rating', '4.99') }
      else if (ratingFilter === '3') { params.set('min_rating', '3'); params.set('max_rating', '3.99') }
      else if (ratingFilter === '2') { params.set('min_rating', '2'); params.set('max_rating', '2.99') }
      else if (ratingFilter === '1') { params.set('min_rating', '1'); params.set('max_rating', '1.99') }

      const res = await fetch(`${REVIEW_API}/my?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/client/signin')
          return
        }
        throw new Error('Failed to load reviews')
      }
      const data = await res.json()
      const list = data.data || []
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })

      const ids = [...new Set(list.map(r => r.property_id))]
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
      setReviews(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, ratingFilter, navigate])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadReviews(1)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [search, ratingFilter, loadReviews])

  async function handleEditReview(id, overallRating, reviewText, ratings) {
    setEditLoading(true)
    setEditError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${REVIEW_API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: overallRating,
          accuracy: ratings.accuracy || null,
          check_in: ratings.checkIn || null,
          cleanliness: ratings.cleanliness || null,
          communication: ratings.communication || null,
          location: ratings.location || null,
          value: ratings.value || null,
          review_text: reviewText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditTarget(null)
      await loadReviews(pagination.page)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeleteReview() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${REVIEW_API}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteTarget(null)
      await loadReviews(pagination.page)
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-1">
          <section className="bg-charcoal pt-28 sm:pt-36 pb-12 sm:pb-16 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-olive/[0.08] rounded-full blur-3xl" />
            </div>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-3">
                  <div className="h-3 bg-white/10 rounded w-20 mb-5 animate-pulse" />
                  <div className="h-10 bg-white/10 rounded w-40 animate-pulse" />
                </div>
                <div className="lg:col-span-9 pb-2">
                  <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </section>
          <section className="py-10 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                  <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
                <div className="lg:col-span-9">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
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
        {/* Hero */}
        <section className="bg-charcoal pt-28 sm:pt-36 pb-12 sm:pb-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-olive/[0.08] rounded-full blur-3xl" />
          </div>

          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-3">
                <div className="animate-fade-up">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sage mb-5">
                    <span className="w-6 h-px bg-sage/60" />
                    Feedback
                    <span className="w-6 h-px bg-sage/60" />
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  My Reviews
                </h1>
                <p className="text-sm text-white/50 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  {pagination.total} {pagination.total === 1 ? 'review' : 'reviews'} shared
                </p>
              </div>
              <div className="lg:col-span-9 flex items-end justify-end pb-2">
                {stats && (
                  <div className="hidden sm:flex items-center gap-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{stats.avg.toFixed(1)}</p>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider">Avg Rating</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-sage">{stats.total}</p>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider">Reviews</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Sidebar */}
              <div className="lg:col-span-3 space-y-5">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-200 text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 rounded-xl transition-all duration-200"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-charcoal transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>

                {/* Filter */}
                <div className="relative">
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full px-4 py-3 pr-8 text-sm font-medium bg-white border border-gray-200 text-charcoal appearance-none focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 rounded-xl cursor-pointer transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="all">All ratings</option>
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>

                {/* Rating Distribution */}
                {stats && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Rating Breakdown</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-sage">{stats.avg.toFixed(1)}</span>
                      </div>
                      <div>
                        <StarRating rating={stats.avg} />
                        <p className="text-[11px] text-gray-400 mt-1">{stats.total} reviews</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.dist[star] || 0
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-gray-500 shrink-0">{star}</span>
                            <svg className="w-3 h-3 text-yellow-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-sage/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-5 text-right text-gray-400">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Actions</h3>
                  <Link
                    to="/bookings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-sage/5 text-sm text-charcoal transition-colors duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                      <svg className="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <span>View My Bookings</span>
                  </Link>
                </div>
              </div>

              {/* Right Content - Reviews */}
              <div className="lg:col-span-9">
                {reviews.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-charcoal mb-1">
                      {search || ratingFilter !== 'all' ? 'No matching reviews' : 'No reviews yet'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                      {search || ratingFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Reviews you write will appear here.'}
                    </p>
                    {!search && ratingFilter === 'all' && (
                      <Link
                        to="/bookings"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white font-medium text-sm hover:bg-charcoal/90 transition-colors rounded-xl"
                      >
                        View My Bookings
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                        </svg>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const prop = properties[review.property_id]
                      const avg = computeAvg(review)
                      return (
                        <div
                          key={review.id}
                          className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                          <div className="flex items-start gap-4 p-5 sm:p-6">
                            {/* Property Thumbnail */}
                            <Link
                              to={`/properties/${review.property_id}`}
                              className="hidden sm:flex flex-col items-center gap-2 pt-1 shrink-0"
                            >
                              <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-gray-100">
                                {prop?.images?.[0] ? (
                                  <img src={prop.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="text-center">
                                <p className="text-[11px] font-semibold text-charcoal hover:text-sage transition-colors leading-tight max-w-[80px] truncate">
                                  {prop?.title || `#${review.property_id}`}
                                </p>
                                {prop?.location && (
                                  <p className="text-[10px] text-gray-400 truncate max-w-[80px]">{prop.location}</p>
                                )}
                              </div>
                            </Link>

                            {/* Review Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <StarRating rating={avg} />
                                  <span className="text-sm font-bold text-charcoal">{avg.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[11px] text-gray-400">{formatDate(review.created_at)}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => { setEditTarget(review); setEditError('') }}
                                      className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-sage hover:bg-sage/5 rounded-lg transition-all bg-transparent border-none cursor-pointer"
                                      title="Edit review"
                                    >
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(review)}
                                      className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all bg-transparent border-none cursor-pointer"
                                      title="Delete review"
                                    >
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {review.review_text ? (
                                <div className="relative mb-4 pl-4 border-l-2 border-sage/20">
                                  <svg className="absolute -top-0.5 -left-1.5 w-3.5 h-3.5 text-sage/15" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179z" />
                                  </svg>
                                  <p className="text-sm text-gray-500 leading-relaxed italic">
                                    &ldquo;{review.review_text}&rdquo;
                                  </p>
                                </div>
                              ) : (
                                <div className="mb-4 pl-4">
                                  <p className="text-sm text-gray-300 italic">No comment provided</p>
                                </div>
                              )}

                              {/* Category Ratings */}
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-400">
                                {['accuracy', 'checkIn', 'cleanliness', 'communication', 'location', 'value'].map(cat => {
                                  const val = Number(review[cat])
                                  if (!val) return null
                                  const labels = { accuracy: 'Accuracy', checkIn: 'Check-in', cleanliness: 'Cleanliness', communication: 'Communication', location: 'Location', value: 'Value' }
                                  return (
                                    <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50">
                                      <span className="font-medium">{labels[cat]}</span>
                                      <span className="flex items-center gap-0.5">
                                        {Array.from({ length: val }).map((_, i) => (
                                          <svg key={i} className="w-2.5 h-2.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </span>
                                    </span>
                                  )
                                })}
                              </div>

                              {/* Mobile Property Info */}
                              <div className="sm:hidden flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-100">
                                  {prop?.images?.[0] ? (
                                    <img src={prop.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/properties/${review.property_id}`}
                                    className="text-xs font-semibold text-charcoal hover:text-sage transition-colors truncate block"
                                  >
                                    {prop?.title || `Property #${review.property_id}`}
                                  </Link>
                                  {prop?.location && (
                                    <p className="text-[10px] text-gray-400 truncate">{prop.location}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10">
                    <button
                      type="button"
                      onClick={() => loadReviews(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-all rounded-xl disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
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
                            onClick={() => loadReviews(p)}
                            className={`w-9 h-9 text-sm font-medium transition-all duration-200 rounded-xl cursor-pointer ${
                              p === pagination.page
                                ? 'bg-charcoal text-white shadow-sm'
                                : 'bg-transparent text-charcoal border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      type="button"
                      onClick={() => loadReviews(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-all rounded-xl disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {editTarget && (
        <EditReviewModal
          review={editTarget}
          propertyTitle={properties[editTarget.property_id]?.title || `Property #${editTarget.property_id}`}
          onClose={() => { setEditTarget(null); setEditError('') }}
          onSubmit={handleEditReview}
          loading={editLoading}
          error={editError}
        />
      )}

      {deleteTarget && (
        <DeleteReviewModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteReview}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

export default Reviews
