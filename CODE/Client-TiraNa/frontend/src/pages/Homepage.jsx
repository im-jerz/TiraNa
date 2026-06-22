import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Footer from '../components/Footer.jsx'
import { fetchFeaturedListings } from '../api/listings.js'
import { RatingStars } from '../components/StarRating.jsx'

const destinations = [
  { name: 'Baguio', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', listings: 48 },
  { name: 'Siargao', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', listings: 36 },
  { name: 'Cebu', image: 'https://images.unsplash.com/photo-1562832135-14a35d25edef?w=400&h=300&fit=crop', listings: 52 },
  { name: 'Palawan', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400&h=300&fit=crop', listings: 29 },
  { name: 'Boracay', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', listings: 41 },
  { name: 'Tagaytay', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', listings: 33 },
]

function Homepage() {
  const [user, setUser] = useState(null)
  const [featuredRooms, setFeaturedRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    fetchFeaturedListings()
      .then(setFeaturedRooms)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Popular Destinations</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Explore the best destinations the Philippines has to offer.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {destinations.map((d) => (
              <Link
                key={d.name}
                to={`/properties?location=${encodeURIComponent(d.name)}`}
                className="group relative h-48 sm:h-56 overflow-hidden bg-charcoal"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base sm:text-lg font-bold text-white">{d.name}</h3>
                  <p className="text-xs text-white/70">{d.listings} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Featured Properties</h2>
              <p className="text-sm sm:text-base text-gray-500">Hand-picked accommodations for your next adventure.</p>
            </div>
            <Link
              to="/properties"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-olive transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white shadow-sm animate-pulse">
                  <div className="h-48 sm:h-56 bg-gray-200" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-4 bg-gray-200 w-3/4" />
                    <div className="h-3 bg-gray-200 w-1/2" />
                    <div className="h-4 bg-gray-200 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              featuredRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/properties/${room.id}`}
                  className="group bg-white shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                      ₱{room.price.toLocaleString()} <span className="font-normal text-gray-500">/ night</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{room.name}</h3>
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
              ))
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/properties"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-olive transition-colors"
            >
              View All Properties
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Explore Nearby</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Discover great places to stay close to your current location.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-50 animate-pulse">
                  <div className="h-44 sm:h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 w-1/2" />
                    <div className="h-4 bg-gray-200 w-3/4" />
                    <div className="h-4 bg-gray-200 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              featuredRooms.slice(0, 3).map((room) => (
                <Link
                  key={room.id}
                  to={`/properties/${room.id}`}
                  className="group bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  <div className="relative h-44 sm:h-48 overflow-hidden">
                    <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                      ₱{room.price.toLocaleString()}<span className="font-normal text-gray-500">/night</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-xs text-sage mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {room.location}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{room.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-charcoal">₱{room.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <RatingStars rating={room.rating} />
                        <span>{room.rating}</span>
                      </div>
                  </div>
                </div>
              </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-16 sm:py-20 bg-gradient-to-br from-charcoal via-teal to-charcoal text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-sm sm:text-base text-white/70 mb-8 max-w-lg mx-auto">Join thousands of travelers who trust TiraNa for their perfect stay.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/client/signup"
                replace
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-sage text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-olive transition-colors"
              >
                Book a Stay
              </Link>
              <Link
                to="http://localhost:5174/signup"
                replace
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 border border-white/30 text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-white/10 transition-colors"
              >
                List Your Property
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}

export default Homepage
