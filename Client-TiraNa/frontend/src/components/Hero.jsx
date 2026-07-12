import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchLocations, fetchStats } from '../api/listings'
import { fetchClientStats, fetchRecentReviewers } from '../api/client'
import { CLIENT_API_URL } from '../api/config'

function useCountUp(target, isVisible, decimal) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    setCount(0)
    if (target === 0) return
    let start = 0
    const duration = 2000
    const increment = target / (duration / 16)
    let raf

    function tick() {
      start += increment
      if (start < target) {
        setCount(decimal ? Math.min(start, target) : Math.floor(Math.min(start, target)))
        raf = requestAnimationFrame(tick)
      } else {
        setCount(target)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isVisible, target, decimal])

  return decimal ? (count / 10).toFixed(1) : Math.floor(count)
}

function StatItem({ label, value, suffix, decimal, visible }) {
  const count = useCountUp(value, visible, decimal)
  const isRating = label === 'Overall Rating'

  return (
    <div>
      <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
        {isRating && <span className="text-yellow-400 mr-1">★</span>}
        {count}{suffix}
      </p>
      <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  )
}

function Hero() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [countersVisible, setCountersVisible] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locations, setLocations] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [siteStats, setSiteStats] = useState({
    total_listings: 0,
    average_rating: 0,
    total_reviews: 0,
    total_guests: 0,
  })
  const counterRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch(() => {})

    fetchRecentReviewers()
      .then(setReviewers)
      .catch(() => {})

    Promise.all([
      fetchStats().catch(() => ({ total_listings: 0 })),
      fetchClientStats().catch(() => ({ average_rating: 0, total_reviews: 0, total_completed_bookings: 0 })),
    ]).then(([hostStats, clientStats]) => {
      setSiteStats({
        total_listings: hostStats.total_listings || 0,
        average_rating: clientStats.average_rating || 0,
        total_reviews: clientStats.total_reviews || 0,
        total_guests: clientStats.total_completed_bookings || 0,
      })
    })
  }, [])

  const ratingDisplay = siteStats.average_rating
    ? siteStats.average_rating.toFixed(1)
    : ''
  const reviewsDisplay = siteStats.total_reviews
    ? `(${siteStats.total_reviews} review${siteStats.total_reviews !== 1 ? 's' : ''})`
    : ''

  useEffect(() => {
    const el = counterRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/properties?location=${encodeURIComponent(search.trim())}`)
    }
  }

  function handleSuggestionClick(location) {
    setSearch(location)
    setShowSuggestions(false)
    navigate(`/properties?location=${encodeURIComponent(location)}`)
  }

  const filteredSuggestions = search.trim()
    ? locations.filter((d) => d.toLowerCase().includes(search.toLowerCase()))
    : locations

  return (
    <section className="relative min-h-[90vh] flex flex-col lg:flex-row bg-charcoal">

      {/* LEFT */}
      <div className="relative w-full lg:w-[58%] flex items-center z-10 px-5 sm:px-8 lg:px-14 xl:px-20 pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16">
        <div className={`w-full max-w-2xl transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Headline */}
          <h1 className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.5rem] lg:text-[3.8rem] xl:text-[4.5rem] font-bold text-white leading-tight tracking-tight mb-6">
            <span>Tahanan. </span>
            <span className="text-sage">Kahit Saan.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
            Mula sa malamig na simoy ng Baguio hanggang sa mainit na alon ng Siargao — may 3,000+ tahanan
            na naghihintay sa'yo.
          </p>

          {/* Search */}
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Saan mo gustong pumunta?"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-sage focus:bg-white/[0.15] transition-all duration-300 text-sm rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-sage text-white font-medium tracking-wider text-sm hover:bg-olive transition-colors duration-300 whitespace-nowrap rounded"
                >
                  Hanapin ang Stay Ko
                </button>
              </div>
            </form>

            {/* Search suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-charcoal border border-white/10 rounded overflow-hidden shadow-xl z-20">
                {filteredSuggestions.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSuggestionClick(d)}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-sage/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Trending pills */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mr-1">Sikat ngayon:</span>
              {locations.slice(0, 5).map((d) => (
                <button
                  key={d}
                  onClick={() => handleSuggestionClick(d)}
                  className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs text-white/70 bg-white/[0.06] border border-white/10 rounded-full hover:bg-white/15 hover:text-white hover:border-white/20 transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Social Proof + Stats */}
          <div ref={counterRef} className="mt-10 sm:mt-12">
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="flex -space-x-2">
                {reviewers.map((r) => (
                  <div key={r.user_id} className="w-8 h-8 rounded-full border-2 border-charcoal overflow-hidden">
                    {r.avatar ? (
                      <img
                        src={r.avatar.startsWith('http') ? r.avatar : `${CLIENT_API_URL}${r.avatar}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-sage/20 flex items-center justify-center text-[10px] font-bold text-sage">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-charcoal bg-sage flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">+</span>
                </div>
              </div>
              {ratingDisplay && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
                <span className="text-yellow-400 text-sm leading-none">★★★★★</span>
                <span className="text-white font-semibold">{ratingDisplay}</span>
                <span className="text-white/30">{reviewsDisplay}</span>
              </div>
              )}
            </div>

            <div className="w-full h-px bg-white/10 mb-5" />

            <div className="flex flex-wrap gap-x-12 gap-y-5">
              <StatItem label="Tahanan sa Pinas" value={siteStats.total_listings} suffix="+" visible={countersVisible} />
              <StatItem label="Overall Rating" value={Math.round(siteStats.average_rating * 10)} suffix="" decimal visible={countersVisible} />
              <StatItem label="Masasayang Guest" value={siteStats.total_reviews} suffix="+" visible={countersVisible} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative w-full lg:w-[42%] h-[40vh] sm:h-[50vh] lg:h-auto overflow-hidden">
        <div className={`w-full h-full transition-all duration-1000 ${loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-80'}`}>
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
            alt="Tropical beach scene"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent lg:bg-gradient-to-r lg:from-charcoal/70 lg:via-charcoal/20 lg:to-transparent" />
      </div>
    </section>
  )
}

export default Hero
