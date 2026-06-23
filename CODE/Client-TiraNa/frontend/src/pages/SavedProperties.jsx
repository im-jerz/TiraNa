import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
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

function SavedProperties() {
  const navigate = useNavigate()
  const [savedItems, setSavedItems] = useState([])
  const [properties, setProperties] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Saved Properties</h1>
            <p className="text-base text-white/60 mt-2">
              {savedItems.length} {savedItems.length === 1 ? 'property' : 'properties'} saved
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {savedItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <HeartIcon className="w-8 h-8 text-gray-300" filled={false} />
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1">No saved properties</h3>
              <p className="text-sm text-gray-400 mb-6">Properties you save will appear here.</p>
              <Link
                to="/properties"
                className="inline-flex px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {savedItems.map(item => {
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

      <Footer />
    </div>
  )
}

export default SavedProperties
