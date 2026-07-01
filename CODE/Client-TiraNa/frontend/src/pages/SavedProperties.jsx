import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { HOST_API_URL } from '../api/config.js'
import { RatingStars } from '../components/StarRating.jsx'

const SAVED_API = 'http://localhost:5000/api/saved-properties'

function HeartIcon({ className, filled }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <div className="h-48 sm:h-56 bg-gray-100 animate-pulse" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-12 animate-pulse" />
        </div>
        <div className="h-3 bg-gray-50 rounded w-1/2 animate-pulse mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
          <div className="h-3 bg-gray-50 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function SavedProperties() {
  const navigate = useNavigate()
  const [savedItems, setSavedItems] = useState([])
  const [properties, setProperties] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const searchTimeout = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signup')
      return
    }
    loadSaved()
  }, [navigate])

  async function loadSaved() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${SAVED_API}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/client/signin')
          return
        }
        throw new Error('Failed to load saved properties')
      }
      const data = await res.json()
      const list = data.data || []

      const ids = [...new Set(list.map(s => s.property_id))]
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
      setSavedItems(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsave(propertyId) {
    setRemovingId(propertyId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${SAVED_API}/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to unsave')
      setSavedItems(prev => prev.filter(s => s.property_id !== propertyId))
      setProperties(prev => {
        const next = { ...prev }
        delete next[propertyId]
        return next
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  const filtered = savedItems
    .filter(item => {
      if (!search) return true
      const prop = properties[item.property_id]
      if (!prop) return false
      const q = search.toLowerCase()
      return (
        (prop.title && prop.title.toLowerCase().includes(q)) ||
        (prop.location && prop.location.toLowerCase().includes(q)) ||
        item.property_id.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const propA = properties[a.property_id]
      const propB = properties[b.property_id]
      if (sortBy === 'price-low') return (propA?.price || 0) - (propB?.price || 0)
      if (sortBy === 'price-high') return (propB?.price || 0) - (propA?.price || 0)
      if (sortBy === 'rating') return (propB?.rating || 0) - (propA?.rating || 0)
      return new Date(b.created_at) - new Date(a.created_at)
    })

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-1">
          <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="h-10 bg-white/10 rounded w-64 mx-auto animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-32 mx-auto mt-3 animate-pulse" />
              </div>
            </div>
          </section>
          <section className="py-8 sm:py-10 -mt-10 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-10 bg-gray-100 rounded w-full mb-4 animate-pulse" />
              <div className="h-10 bg-gray-100 rounded w-48 mb-8 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
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
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Saved Properties</h1>
            <p className="text-base text-white/60 mt-2">
              {savedItems.length} {savedItems.length === 1 ? 'property' : 'properties'} saved
            </p>
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
                placeholder="Search by property name or location..."
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

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 text-charcoal focus:outline-none focus:border-sage cursor-pointer"
              >
                <option value="recent">Recently saved</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top rated</option>
              </select>
              <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <HeartIcon className="w-8 h-8 text-gray-300" filled={false} />
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1">
                {search ? 'No matching properties' : 'No saved properties'}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                {search ? 'Try a different search term.' : 'Properties you save will appear here.'}
              </p>
              {!search && (
                <Link
                  to="/properties"
                  className="inline-flex px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
                >
                  Browse Properties
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map(item => {
                const prop = properties[item.property_id]
                if (!prop) return null
                return (
                  <div
                    key={item.id}
                    className="group bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleUnsave(item.property_id)}
                      disabled={removingId === item.property_id}
                      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm transition-all disabled:opacity-50"
                      title="Remove from saved"
                    >
                      <HeartIcon
                        className={`w-4 h-4 transition-colors ${removingId === item.property_id ? 'text-gray-300' : 'text-red-500'}`}
                        filled={removingId !== item.property_id}
                      />
                    </button>

                    <Link to={`/properties/${item.property_id}`} className="block">
                      <div className="relative h-48 sm:h-56 overflow-hidden">
                        <img
                          src={prop.images?.[0] || ''}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                          ₱{prop.price?.toLocaleString()} <span className="font-normal text-gray-500">/ night</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{prop.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0 ml-2">
                            <RatingStars rating={prop.rating} />
                            <span>{prop.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3">{prop.location}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-teal">₱{prop.price?.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                          <span className="text-xs font-medium text-olive group-hover:underline">View Details</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      </div>
    </div>
  )
}

export default SavedProperties
