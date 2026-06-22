import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { fetchListings } from '../api/listings.js'
import { RatingStars } from '../components/StarRating.jsx'

function AllProperties() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')

  useEffect(() => {
    fetchListings()
      .then(setRooms)
      .catch((err) => setError(err.message || 'Failed to load properties'))
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
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Explore All Stays
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto">
               Discover unique stays across the Philippines — from city condos to beachfront villas.
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-sage transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:border-sage transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="text-charcoal">Sort by</option>
              <option value="price-asc" className="text-charcoal">Price: Low to High</option>
              <option value="price-desc" className="text-charcoal">Price: High to Low</option>
              <option value="rating" className="text-charcoal">Highest Rated</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400 mb-8">
            {filteredRooms.length} {filteredRooms.length === 1 ? 'property' : 'properties'} found
          </p>

          {error ? (
            <div className="text-center py-20">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-2">Make sure Host-TiraNa backend is running on port 5001.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white shadow-sm animate-pulse">
                  <div className="h-52 sm:h-56 bg-gray-200" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-4 bg-gray-200 w-3/4" />
                    <div className="h-3 bg-gray-200 w-1/2" />
                    <div className="h-3 bg-gray-200 w-1/3" />
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

      <Footer />
    </div>
  )
}

export default AllProperties
