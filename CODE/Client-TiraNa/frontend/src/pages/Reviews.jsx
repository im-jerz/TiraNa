import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { HOST_API_URL } from '../api/config.js'

const REVIEW_API = 'http://localhost:5000/api/reviews'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-1">Edit Review</h3>
        <p className="text-sm text-gray-500 mb-5 truncate">{propertyTitle}</p>

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
            disabled={loading || Object.values(editRatings).every(v => Number(v) === 0)}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-sage hover:bg-olive transition-colors disabled:opacity-40"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-charcoal mb-2">Delete Review</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Are you sure you want to delete this review? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
          >
            Keep Review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
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

  const [editTarget, setEditTarget] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin')
      return
    }
    loadReviews()
  }, [navigate])

  async function loadReviews() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${REVIEW_API}/my`, {
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

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setProperties(map)
      setReviews(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
      await loadReviews()
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
      await loadReviews()
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center pt-40">
          <div className="w-6 h-6 border-2 border-sage border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">My Reviews</h1>
            <p className="text-base text-white/60 mt-2">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} shared
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1">No reviews yet</h3>
              <p className="text-sm text-gray-400 mb-6">Reviews you write will appear here.</p>
              <Link
                to="/bookings"
                className="inline-flex px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
              >
                View My Bookings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map(review => {
                const prop = properties[review.property_id]
                return (
                  <div
                    key={review.id}
                    className="group bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-6 sm:p-8 flex flex-col relative"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setEditTarget(review); setEditError('') }}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-sage hover:bg-sage/5 rounded transition-colors bg-transparent border-none cursor-pointer"
                        title="Edit review"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(review)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors bg-transparent border-none cursor-pointer"
                        title="Delete review"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      {(() => {
                        const cats = ['accuracy', 'checkIn', 'cleanliness', 'communication', 'location', 'value']
                        const vals = cats.map(k => Number(review[k])).filter(v => v > 0)
                        const avg = vals.length > 0
                          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
                          : Number(review.rating)
                        return (
                          <>
                            <StarRating rating={avg} size="lg" />
                            <span className="text-[11px] text-gray-400 font-medium ml-2">{avg.toFixed(1)}</span>
                          </>
                        )
                      })()}
                      <span className="text-[11px] text-gray-400 font-medium">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {review.review_text ? (
                      <div className="relative flex-1 mb-5">
                        <svg className="absolute -top-1 left-0 w-5 h-5 text-sage/15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179z" />
                        </svg>
                        <p className="text-sm text-gray-600 leading-relaxed pl-5 italic">
                          &ldquo;{review.review_text}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 mb-5 flex items-center justify-center">
                        <p className="text-sm text-gray-300 italic">No comment provided</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                      <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden shrink-0 ring-1 ring-gray-200">
                        {prop?.images?.[0] ? (
                          <img
                            src={prop.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/properties/${review.property_id}`}
                          className="text-sm font-semibold text-charcoal hover:text-sage transition-colors truncate block"
                        >
                          {prop?.title || `Property #${review.property_id}`}
                        </Link>
                        {prop?.location && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{prop.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />

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
