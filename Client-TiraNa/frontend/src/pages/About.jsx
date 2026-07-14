import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { HOST_APP_URL } from '../api/config.js'

const values = [
  {
    title: 'Identity Verification',
    description: 'Landlords and tenants must submit valid government IDs and proof of ownership for admin approval, preventing fraud and scams.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    description: 'PayMongo-integrated payments supporting GCash, Maya, and credit/debit cards with transaction records for both parties.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Lease Management',
    description: 'Digital lease contracts created and stored within the system, replacing informal verbal agreements.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Neighborhood Guides',
    description: 'Cost-of-living data, commute options, safety info, and nearby amenities to help migrants navigate unfamiliar cities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Register & Verify',
    description: 'Create an account and submit your government ID for identity verification to ensure a trusted community.',
    color: 'bg-sage',
  },
  {
    step: '02',
    title: 'Browse & Book',
    description: 'Search verified listings by location, price, and amenities. Reserve your stay with secure PayMongo payments.',
    color: 'bg-teal',
  },
  {
    step: '03',
    title: 'List & Earn',
    description: 'Submit your property with proof of ownership for admin approval. Manage bookings and track earnings.',
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
      <section className="bg-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-olive/[0.08] rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sage mb-5">
                <span className="w-6 h-px bg-sage/60" />
                About
                <span className="w-6 h-px bg-sage/60" />
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              About TiraNa
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              A digital rental platform designed for fresh graduates from Philippine provinces who relocate to Metro Manila for employment.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-xs font-semibold uppercase tracking-widest text-sage">About the Platform</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-4">Verified Rentals, Secure Payments, Real Protection</h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4">
                TiraNa addresses the lack of verified data on safety, availability, and legitimacy in existing online rental systems. The platform targets fresh graduates from Philippine provinces who face pervasive rental scams, housing costs consuming 60–100% of entry-level salaries, and informal lease agreements with no legal recourse.
              </p>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4">
                By consolidating landlord and tenant identity verification, secure payments through PayMongo (GCash, Maya, cards), digital lease management, in-app messaging, and neighborhood guides with cost-of-living data into a single platform, TiraNa aims to reduce scam exposure, formalize rental agreements, and improve housing outcomes.
              </p>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                The system comprises three interconnected modules — Admin, Host, and Client — built with ReactJS frontend and containerized via Docker, ensuring every booking is visible to tenants, landlords, and administrators simultaneously.
              </p>
            </div>
            <div className="relative animate-scale-in">
              <div className="relative h-72 sm:h-96 overflow-hidden">
                <img
                  src="/favicon.svg"
                  alt="TiraNa logo"
                  className="w-full h-full object-contain p-8"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-sage text-white px-6 py-4 hidden sm:block">
                <p className="text-2xl font-bold">TiraNa</p>
                <p className="text-xs text-white/80">Digital Rental Platform</p>
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-3">List Your Property, Start Earning</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Submit your property for verification and connect with verified tenants through a trusted platform.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'Submit for Verification', desc: 'Provide proof of ownership and government ID for admin approval.' },
                { title: 'Create Listings', desc: 'Add photos, set pricing, define amenities, and manage availability.' },
                { title: 'Manage Bookings', desc: 'Accept or decline reservations and track all transactions.' },
                { title: 'Track Revenue', desc: 'Monitor earnings, payout history, and booking statistics.' },
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
                to={`${HOST_APP_URL}/signup`}
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Start Your Rental Journey Safely</h2>
          <p className="text-sm sm:text-base text-white/70 mb-8 max-w-lg mx-auto">Join a verified community of tenants and landlords. Find affordable housing or list your property with confidence.</p>
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
