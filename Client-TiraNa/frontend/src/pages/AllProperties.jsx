import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx'
import { fetchListings, fetchLocations } from '../api/listings.js'

const CITIES_DATA = [
  { name: 'Manila', slug: 'manila', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80', tagline: 'Capital Region' },
  { name: 'Cebu', slug: 'cebu', image: 'https://images.unsplash.com/photo-1572526889265-b7a84be2e83e?auto=format&fit=crop&w=600&q=80', tagline: 'Queen City of the South' },
  { name: 'Davao', slug: 'davao', image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=600&q=80', tagline: 'City of Durian' },
  { name: 'Baguio', slug: 'baguio', image: 'https://images.unsplash.com/photo-1583161129718-b07f2a0f4b2c?auto=format&fit=crop&w=600&q=80', tagline: 'Summer Capital' },
  { name: 'Tagaytay', slug: 'tagaytay', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', tagline: 'Ridge City' },
  { name: 'Clark', slug: 'clark', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=600&q=80', tagline: 'Freeport Zone' },
]

function CityTag({ city }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sage/10 text-sage text-[10px] font-medium rounded-full uppercase tracking-wider">
      <span className="w-1 h-1 rounded-full bg-sage" />
      {city}
    </span>
  )
}

function UrbanOverlay({ property }) {
  const location = (property.location || '').toLowerCase()
  const type = (property.type || '').toLowerCase()

  const tags = []
  if (type.includes('condo') || type.includes('apartment')) tags.push('🏢 ' + property.type)
  if (type.includes('house') || type.includes('townhouse')) tags.push('🏠 ' + property.type)
  if (location.includes('makati') || location.includes('bgc') || location.includes('global city')) tags.push('📍 CBD Area')
  if (location.includes('near') || location.includes('center') || location.includes('downtown')) tags.push('🚇 City Center')

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 2).map((tag, i) => (
        <span key={i} className="inline-flex items-center px-2 py-0.5 bg-charcoal/70 backdrop-blur-sm text-white/90 text-[10px] font-medium rounded-md">
          {tag}
        </span>
      ))}
    </div>
  )
}

function AllProperties() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [activeCity, setActiveCity] = useState('')
  const [locations, setLocations] = useState([])
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchListings(),
      fetchLocations(),
    ]).then(([listings, locs]) => {
      setRooms(listings || [])
      setLocations(locs || [])
      setLoading(false)
    }).catch(() => {
      setFetchError(true)
    })
  }, [])

  const filteredRooms = useMemo(() => {
    let result = [...rooms]

    if (activeCity) {
      result = result.filter(r =>
        (r.location || '').toLowerCase().includes(activeCity.toLowerCase())
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        (r.title || r.name || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q)
      )
    }

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)

    return result
  }, [rooms, search, sort, activeCity])

  const cityCounts = useMemo(() => {
    const counts = {}
    rooms.forEach(r => {
      const loc = r.location || ''
      CITIES_DATA.forEach(c => {
        if (loc.toLowerCase().includes(c.name.toLowerCase())) {
          counts[c.name] = (counts[c.name] || 0) + 1
        }
      })
    })
    return counts
  }, [rooms])

  const avgPrice = useMemo(() => {
    if (filteredRooms.length === 0) return 0
    return Math.round(filteredRooms.reduce((s, r) => s + (r.price || 0), 0) / filteredRooms.length)
  }, [filteredRooms])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .card-featured > a > div:first-child { height: 100% !important; min-height: 320px; }
        .card-featured > a > div:first-child > img { height: 100% !important; }
        @media (min-width: 640px) {
          .card-featured > a > div:first-child { min-height: 360px; }
        }
      `}</style>
      <Header />

      <div className="flex-1">

        {/* ══════ HERO ══════ */}
        <section className="bg-charcoal pt-28 sm:pt-36 pb-16 sm:pb-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-sage mb-4 sm:mb-5 animate-fade-up">
                <span className="w-5 h-px bg-sage/50" />
                Urban Rentals
                <span className="w-5 h-px bg-sage/50" />
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-5 tracking-tight leading-[1.1] animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Find Your City Home
              </h1>

              <p className="text-sm sm:text-base text-white/50 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
                Apartments, condos, and houses across the Philippines' most vibrant cities.
              </p>
            </div>

            {/* Search + Sort */}
            <div className="max-w-2xl mx-auto mt-8 sm:mt-10 animate-slide-up" style={{ animationDelay: '0.35s' }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by city, neighborhood, or type..."
                    className="w-full pl-10 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/40 transition-all duration-300"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-5 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/40 transition-all duration-300 appearance-none cursor-pointer min-w-[170px]"
                >
                  <option value="" className="text-charcoal">Sort by</option>
                  <option value="price-asc" className="text-charcoal">Rent: Low to High</option>
                  <option value="price-desc" className="text-charcoal">Rent: High to Low</option>
                  <option value="rating" className="text-charcoal">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* City Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 sm:mt-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={() => setActiveCity('')}
                className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 border ${
                  !activeCity
                    ? 'bg-sage text-white border-sage'
                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/25 hover:text-white/70'
                }`}
              >
                All Cities
              </button>
              {CITIES_DATA.map(c => (
                <button
                  key={c.name}
                  onClick={() => setActiveCity(activeCity === c.name ? '' : c.name)}
                  className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 border ${
                    activeCity === c.name
                      ? 'bg-sage text-white border-sage'
                      : 'bg-white/5 text-white/50 border-white/10 hover:border-white/25 hover:text-white/70'
                  }`}
                >
                  {c.name}
                  {cityCounts[c.name] ? <span className="ml-1.5 text-white/30">{cityCounts[c.name]}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CITY STATS BAR ══════ */}
        {!loading && rooms.length > 0 && (
          <section className="border-b border-gray-100 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 sm:py-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                  <span className="font-semibold text-charcoal">{filteredRooms.length}</span>
                  <span>{filteredRooms.length === 1 ? 'property' : 'properties'} available
                    {activeCity && <span> in <span className="font-medium text-charcoal">{activeCity}</span></span>}
                  </span>
                </div>
                {avgPrice > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                    <span>Avg rent:</span>
                    <span className="font-semibold text-charcoal">₱{avgPrice.toLocaleString()}/night</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                  <span className="font-semibold text-charcoal">{locations.length || CITIES_DATA.length}</span>
                  <span>cities covered</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════ PROPERTY GRID ══════ */}
        <section id="property-grid" className="pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <span className="text-[10px] sm:text-[11px] text-sage font-semibold uppercase tracking-[0.2em]">Available</span>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal mt-1 tracking-tight">
                  {activeCity ? `Properties in ${activeCity}` : 'All Properties'}
                </h2>
              </div>
              {!loading && filteredRooms.length > 0 && (
                <p className="text-xs text-gray-400 hidden sm:block">
                  {filteredRooms.length} {filteredRooms.length === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>

            {loading || fetchError ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={i === 0 ? 'sm:col-span-2 lg:col-span-2 card-featured' : ''}>
                    <PropertyCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sage/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sage/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-charcoal text-sm font-semibold mb-1">No properties found</p>
                <p className="text-gray-400 text-xs mb-3">
                  {activeCity ? `No listings in ${activeCity} yet.` : 'Try adjusting your search or filters.'}
                </p>
                <button
                  onClick={() => { setSearch(''); setActiveCity(''); setSort(''); }}
                  className="text-xs font-medium text-sage hover:text-olive transition-colors underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
                {filteredRooms.map((room, i) => {
                  const isFeatured = i % 7 === 0
                  const isWide = !isFeatured && i % 7 === 3
                  const delay = (i % 6) * 60

                  return (
                    <div
                      key={room.id}
                      className={`
                        transition-all duration-500 ease-out
                        ${isFeatured ? 'sm:col-span-2 lg:col-span-2 card-featured' : ''}
                        ${isWide ? 'lg:col-span-2' : ''}
                      `}
                      style={{ opacity: 0, animation: `fadeSlideUp 0.6s ${delay}ms ease-out forwards` }}
                    >
                      <PropertyCard
                        property={room}
                        overlay={<UrbanOverlay property={room} />}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && filteredRooms.length > 0 && (
              <div className="flex items-center gap-4 mt-14 sm:mt-16 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <span className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-medium">End of listings</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

export default AllProperties
