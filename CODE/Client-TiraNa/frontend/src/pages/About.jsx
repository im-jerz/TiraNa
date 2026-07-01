import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

const stats = [
  { label: 'Available Properties', value: '20+' },
  { label: 'Happy Guests', value: '50+' },
  { label: 'Verified Hosts', value: '15+' },
  { label: 'Cities Covered', value: '10+' },
]

const values = [
  {
    title: 'For Hosts',
    description: 'List your property easily and start earning. Set your own price, availability, and house rules.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'For Guests',
    description: 'Browse and book unique stays from cozy studios to entire houses. Filter by location, price, and amenities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Easy to Use',
    description: 'Simple and intuitive interface designed for both hosts and guests. List or book in just a few clicks.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Secure & Reliable',
    description: 'Safe booking process with verified listings and secure transactions for peace of mind.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Browse Listings',
    description: 'Explore available properties. Use filters to find the perfect match for your needs and budget.',
    color: 'bg-sage',
  },
  {
    step: '02',
    title: 'Book a Stay',
    description: 'Reserve your chosen property with ease. View details, check availability, and confirm your booking instantly.',
    color: 'bg-teal',
  },
  {
    step: '03',
    title: 'Host Your Property',
    description: 'List your own property. Set your price, upload photos, and start accepting guests in minutes.',
    color: 'bg-olive',
  },
]

function About() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex-1">
      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight animate-fade-up">
              About TiraNa
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              TiraNa is a platform where homeowners can list their properties, and travelers can find the perfect place to stay.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-xs font-semibold uppercase tracking-widest text-sage">About the Platform</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-4">List Your Space, Find Your Stay</h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4">
                TiraNa is a full-featured accommodation marketplace built for everyone. Whether you have a spare space or an entire house, or you&apos;re looking for a place to stay, our platform makes it easy to connect hosts with travelers.
              </p>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4">
                Hosts can list their properties with photos, pricing, and availability — then manage bookings directly through their dashboard. Guests can browse listings, compare options, and reserve their ideal stay with just a few clicks.
              </p>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                Built as a school project, TiraNa demonstrates how modern web technologies come together to create a real-world application — from user authentication and database management to responsive design and seamless user experience.
              </p>
            </div>
            <div className="relative animate-scale-in">
              <div className="relative h-72 sm:h-96 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556911220-bffb0c8e0f7c?w=600&h=500&fit=crop"
                  alt="TiraNa story"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-sage text-white px-6 py-4 hidden sm:block">
                <p className="text-2xl font-bold">TiraNa</p>
                <p className="text-xs text-white/80">Accommodation Marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-sage">How It Works</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-3">For Guests and Hosts</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Whether you&apos;re looking for a stay or listing your space, TiraNa makes it simple.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative bg-white p-8 sm:p-10 text-center shadow-sm hover:shadow-lg transition-shadow duration-300 animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={`w-12 h-12 ${item.color} text-white flex items-center justify-center mx-auto mb-6 text-sm font-bold`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-charcoal mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center animate-scale-in">
                <p className="text-3xl sm:text-4xl font-bold text-teal mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-sage">Our Values</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-3">What We Stand For</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">The principles that guide every decision we make.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, i) => (
              <div key={value.title} className="bg-white p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 bg-sage/10 text-sage flex items-center justify-center mb-5">
                  {value.icon}
                </div>
                <h3 className="text-base font-bold text-charcoal mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-sage">For Hosts</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-3">Earn by Sharing Your Space</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Have an extra space or a whole house? List it on TiraNa and start hosting today.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'List Your Property', desc: 'Add photos, set pricing, and define availability in minutes.' },
                { title: 'Manage Bookings', desc: 'Accept or decline reservations from your dashboard.' },
                { title: 'Earn Income', desc: 'Set your own rates and earn money from your extra space.' },
                { title: 'Connect with Guests', desc: 'Message travelers and provide a great stay experience.' },
              ].map((item, i) => (
                <div key={item.title} className="flex items-center gap-4 p-5 bg-gray-50 hover:bg-sage/5 transition-colors duration-300 group animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 bg-teal text-white flex items-center justify-center shrink-0 text-xs font-bold uppercase group-hover:bg-olive transition-colors">
                    {item.title.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-charcoal">{item.title}</h3>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-sage transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to="http://localhost:5174/signup"
                replace
                className="inline-block px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-xs sm:text-sm hover:bg-olive transition-colors"
              >
                Start Hosting Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-16 sm:py-20 bg-gradient-to-br from-charcoal via-teal to-charcoal text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Experience TiraNa Today</h2>
          <p className="text-sm sm:text-base text-white/70 mb-8 max-w-lg mx-auto">List your property or book your next stay — all in one platform.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/client/signup"
              replace
              className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-sage text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-olive transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/properties"
              className="inline-block px-8 sm:px-10 py-3 sm:py-4 border border-white/30 text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-white/10 transition-colors"
            >
              Browse Stays
            </Link>
          </div>
        </div>
      </section>
      )}

      </div>
    </div>
  )
}

export default About
