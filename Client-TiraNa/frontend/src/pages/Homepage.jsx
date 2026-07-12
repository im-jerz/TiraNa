import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx'
import { fetchFeaturedListings } from '../api/listings.js'



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

      <section className="py-16 sm:py-20 bg-gradient-to-b from-sage/[0.03] via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 sm:mb-12">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-3">
                <span className="w-5 h-px bg-sage/50" />
                Curated Selection
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Featured Properties</h2>
              <p className="text-sm sm:text-base text-gray-400">Hand-picked accommodations for your next adventure.</p>
            </div>
            <Link
              to="/properties"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-olive transition-colors bg-sage/5 hover:bg-sage/10 px-4 py-2 rounded-lg"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading || featuredRooms.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))
            ) : (
              featuredRooms.map((room) => (
                <PropertyCard key={room.id} property={room} />
              ))
            )}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-olive transition-colors bg-sage/5 px-5 py-2.5 rounded-lg"
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

      <section className="py-16 sm:py-20 bg-sage/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-3">
              <span className="w-5 h-px bg-sage/50" />
              Discover
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Explore Nearby</h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">Discover great places to stay close to your current location.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {loading || featuredRooms.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))
            ) : (
              featuredRooms.slice(0, 3).map((room) => (
                <PropertyCard key={room.id} property={room} />
              ))
            )}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-20 sm:py-28 bg-gradient-to-br from-charcoal via-teal to-charcoal text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-sage/[0.06] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-olive/[0.06] rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ready to Start Your Journey?</h2>
            <p className="text-sm sm:text-base text-white/60 mb-10 max-w-lg mx-auto">Join thousands of travelers who trust TiraNa for their perfect stay.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/client/signup"
                replace
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-sage text-white font-semibold uppercase tracking-wider text-sm sm:text-base hover:bg-olive transition-colors rounded-xl shadow-[0_4px_20px_rgba(156,176,128,0.3)]"
              >
                Book a Stay
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Link>
              <Link
                to="http://localhost:5174/signup"
                replace
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 border border-white/20 text-white/90 font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-white/10 hover:border-white/40 transition-colors rounded-xl"
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
