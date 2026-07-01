import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import { fetchFeaturedListings } from '../api/listings.js'
import { RatingStars } from '../components/StarRating.jsx'



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
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex-1">
      <Hero />

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
            {loading || featuredRooms.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white shadow-sm animate-pulse">
                  <div className="relative h-48 sm:h-56 bg-gray-200">
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
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">How It Works</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Book your perfect stay in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative">
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-teal/20 via-teal/40 to-teal/20" />
            {[
              {
                step: '01',
                title: 'Search & Discover',
                desc: 'Browse through hundreds of unique properties across the Philippines. Filter by location, price, and amenities to find your perfect match.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )
              },
              {
                step: '02',
                title: 'Book Instantly',
                desc: 'Reserve your chosen property with just a few clicks. Secure payment processing and instant confirmation guaranteed.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                step: '03',
                title: 'Enjoy Your Stay',
                desc: 'Check in and create unforgettable memories. Our hosts ensure you have everything you need for a comfortable experience.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <div key={i} className="relative text-center px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/10 text-teal mb-6 relative z-10">
                  {item.icon}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-6xl font-bold text-teal/10 -z-0">{item.step}</div>
                <h3 className="text-lg font-bold text-charcoal mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
            {loading || featuredRooms.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-50 animate-pulse">
                  <div className="relative h-44 sm:h-48 bg-gray-200">
                    <div className="absolute top-3 right-3 w-16 h-5 bg-gray-300 rounded" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3.5 h-3.5 bg-gray-200 rounded-full" />
                      <div className="h-3 bg-gray-200 w-1/3 rounded" />
                    </div>
                    <div className="h-4 bg-gray-200 w-2/3 rounded mb-2" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 w-1/4 rounded" />
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-full" />
                        <div className="w-6 h-3 bg-gray-200 rounded" />
                      </div>
                    </div>
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

      </div>
    </div>
  )
}

export default Homepage
