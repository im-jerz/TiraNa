import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { fetchListings } from '../api/listings.js'
import { RatingStars } from '../components/StarRating.jsx'

function AllProperties() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')

  useEffect(() => {
    fetchListings()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredRooms = useMemo(() => {
    let result = [...rooms]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      )
    }

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)

    return result
  }, [rooms, search, sort])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex-1">
      <section className="bg-charcoal pt-28 sm:pt-36 pb-24 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-olive/[0.08] rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sage mb-5">
                <span className="w-6 h-px bg-sage/60" />
                Find Your Stay
                <span className="w-6 h-px bg-sage/60" />
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.1] animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Explore All Stays
            </h1>

            <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Discover unique stays across the Philippines — from city condos to beachfront villas.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mt-10 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search destinations..."
                  className="w-full pl-10 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/40 transition-all duration-300"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-5 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/40 transition-all duration-300 appearance-none cursor-pointer min-w-[170px]"
              >
                <option value="" className="text-charcoal">Sort by</option>
                <option value="price-asc" className="text-charcoal">Price: Low to High</option>
                <option value="price-desc" className="text-charcoal">Price: High to Low</option>
                <option value="rating" className="text-charcoal">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!loading && rooms.length > 0 && (
            <p className="text-sm text-gray-400 mb-8">
              {filteredRooms.length} {filteredRooms.length === 1 ? 'property' : 'properties'} found
            </p>
          )}

          {loading || rooms.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white shadow-sm animate-pulse">
                  <div className="relative h-52 sm:h-56 bg-gray-200">
                    <div className="absolute top-3 right-3 w-20 h-5 bg-gray-300 rounded" />
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-4 bg-gray-200 w-2/3 rounded" />
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-full" />
                        <div className="w-6 h-3 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 w-1/2 rounded mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 w-1/4 rounded" />
                      <div className="h-3 bg-gray-200 w-16 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-400 text-sm">No properties match your search.</p>
              <button onClick={() => setSearch('')} className="mt-3 text-sm text-teal hover:text-olive transition-colors underline underline-offset-2">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/properties/${room.id}`}
                  className="group bg-white shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                      ₱{room.price.toLocaleString()} <span className="font-normal text-gray-500">/ night</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{room.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0 ml-2">
                        <RatingStars rating={room.rating} />
                        <span>{room.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3">{room.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-teal">₱{room.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                      <span className="text-xs font-medium text-olive group-hover:underline">View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      </div>
    </div>
  )
}

export default AllProperties
