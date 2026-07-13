import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx'
import { HOST_API_URL } from '../api/config.js'
import { fetchPropertyRatings } from '../api/listings.js'

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

function SavedProperties() {
  const navigate = useNavigate()
  const [savedItems, setSavedItems] = useState([])
  const [properties, setProperties] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')

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

      const ratings = await fetchPropertyRatings(ids)
      for (const pid of ids) {
        if (map[pid] && ratings[pid] != null) {
          map[pid] = { ...map[pid], rating: ratings[pid] }
        }
      }

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
                  <div className="h-10 bg-white/10 rounded w-48 mb-3 animate-pulse" />
                  <div className="h-3 bg-white/10 rounded w-64 animate-pulse" />
                </div>
                <div className="lg:col-span-9 flex items-end justify-end pb-2">
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-right">
                      <div className="h-7 bg-white/10 rounded w-12 mb-1 animate-pulse" />
                      <div className="h-2 bg-white/10 rounded w-14 animate-pulse" />
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-right">
                      <div className="h-7 bg-white/10 rounded w-12 mb-1 animate-pulse" />
                      <div className="h-2 bg-white/10 rounded w-16 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="py-12 -mt-10 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                  <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
                <div className="lg:col-span-9">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <PropertyCardSkeleton key={i} />
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
                    Favorites
                    <span className="w-6 h-px bg-sage/60" />
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  Saved Properties
                </h1>
                <p className="text-sm text-white/50 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  Your curated collection of favorite properties. Quick access to places you love.
                </p>
              </div>
              <div className="lg:col-span-9 flex items-end justify-end pb-2">
                <div className="hidden sm:flex items-center gap-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{savedItems.length}</p>
                    <p className="text-[11px] text-white/40 uppercase tracking-wider">Saved</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                    <p className="text-2xl font-bold text-sage">
                      {new Set(savedItems.map(s => properties[s.property_id]?.location).filter(Boolean)).size}
                    </p>
                    <p className="text-[11px] text-white/40 uppercase tracking-wider">Locations</p>
                  </div>
                </div>
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
                    placeholder="Search..."
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

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 pr-8 text-sm font-medium bg-white border border-gray-200 text-charcoal appearance-none focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 rounded-xl cursor-pointer transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="recent">Recently saved</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top rated</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>

                {/* Stats Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Collection</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total saved</span>
                      <span className="text-sm font-semibold text-charcoal">{savedItems.length}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Showing</span>
                      <span className="text-sm font-semibold text-charcoal">{filtered.length}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Actions</h3>
                  <Link
                    to="/properties"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-sage/5 text-sm text-charcoal transition-colors duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                      <svg className="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <span>Browse more properties</span>
                  </Link>
                </div>
              </div>

              {/* Right Content - Cards */}
              <div className="lg:col-span-9">
                {filtered.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
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
                        className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white font-medium text-sm hover:bg-charcoal/90 transition-colors rounded-xl"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        Browse Properties
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filtered.map(item => {
                      const prop = properties[item.property_id]
                      if (!prop) return null
                      return (
                        <PropertyCard
                          key={item.id}
                          property={{ ...prop, id: item.property_id }}
                          overlay={
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsave(item.property_id) }}
                              disabled={removingId === item.property_id}
                              className="w-9 h-9 flex items-center justify-center bg-white hover:bg-white rounded-full shadow-sm transition-all disabled:opacity-50 border-none cursor-pointer"
                              title="Remove from saved"
                            >
                              <HeartIcon
                                className={`w-4 h-4 transition-colors ${removingId === item.property_id ? 'text-gray-300' : 'text-red-500'}`}
                                filled={removingId !== item.property_id}
                              />
                            </button>
                          }
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SavedProperties
