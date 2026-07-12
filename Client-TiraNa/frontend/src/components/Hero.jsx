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
    <div className="text-center">
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none mb-1">
        {isRating && <span className="text-yellow-400 mr-0.5">★</span>}
        {count}{suffix}
      </p>
      <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
    </div>
  )
}

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
]

function Hero() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [countersVisible, setCountersVisible] = useState(false)
  const [locations, setLocations] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [siteStats, setSiteStats] = useState({
    total_listings: 0,
    average_rating: 0,
    total_reviews: 0,
    total_guests: 0,
  })
  const counterRef = useRef(null)

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

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/properties?location=${encodeURIComponent(search.trim())}`)
    }
  }

  function handleSuggestionClick(location) {
    setSearch(location)
    navigate(`/properties?location=${encodeURIComponent(location)}`)
  }

  return (
    <section className="relative min-h-[90vh] flex flex-col lg:flex-row bg-charcoal overflow-hidden">

      {/* ── LEFT ── */}
      <div className="relative w-full lg:w-[55%] flex z-10">
        <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28 pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-16">
          <div className={`w-full max-w-[600px] 2xl:max-w-[680px] transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

            {/* Eyebrow */}
            <div className={`flex items-center gap-2.5 mb-6 lg:mb-7 transition-all duration-500 delay-100 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-8 h-[2px] bg-sage" />
              <span className="text-[10px] sm:text-[11px] text-sage font-medium uppercase tracking-[0.2em]">TiraNa</span>
            </div>

            {/* Headline */}
            <h1 className={`text-[2rem] sm:text-[2.6rem] md:text-[3rem] lg:text-[3.5rem] xl:text-[4rem] 2xl:text-[4.5rem] font-bold text-white leading-[1.1] tracking-tight mb-4 lg:mb-5 transition-all duration-600 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              Hanap ng<br />
              <span className="text-sage">Tahanan?</span>
            </h1>

            {/* Subheadline */}
            <p className={`text-sm sm:text-[15px] lg:text-base text-white/40 leading-relaxed mb-10 lg:mb-12 max-w-md transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Apartments, condos, at bahay na for rent sa buong Pilipinas. Piliin ang lungsod mo at simulan ang hanap.
            </p>

            {/* ── SEARCH BAR ── */}
            <div className={`transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-white/[0.07] border border-white/[0.1] rounded-xl overflow-hidden transition-all duration-300 focus-within:border-sage/50 focus-within:bg-white/[0.1]">
                  <div className="pl-5 pr-2 py-4 lg:py-5">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-sage/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Saan gusto mo mag-rent?"
                    className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-[15px] lg:text-base py-4 lg:py-5 pr-2"
                  />
                  <button
                    type="submit"
                    className="m-1.5 px-5 lg:px-6 py-3 lg:py-3.5 bg-sage text-white font-semibold text-sm hover:bg-olive transition-all duration-300 rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Hanapin
                  </button>
                </div>
              </form>

              {/* Trending */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 lg:mt-5">
                <span className="text-[10px] text-white/20 uppercase tracking-wider">Sikat:</span>
                {locations.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSuggestionClick(d)}
                    className="text-[12px] lg:text-[13px] text-white/30 hover:text-sage transition-colors duration-300"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Proof + Stats */}
            <div ref={counterRef} className={`mt-12 lg:mt-16 transition-all duration-700 delay-600 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                {/* Avatars + Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {reviewers.map((r) => (
                      <div key={r.user_id} className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-charcoal overflow-hidden">
                        {r.avatar ? (
                          <img
                            src={r.avatar.startsWith('http') ? r.avatar : `${CLIENT_API_URL}${r.avatar}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-sage/20 flex items-center justify-center text-[9px] font-bold text-sage">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-charcoal bg-sage/80 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">+</span>
                    </div>
                  </div>
                  {ratingDisplay && (
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <span className="text-yellow-400 text-[11px]">★★★★★</span>
                      <span className="text-white/70 font-medium">{ratingDisplay}</span>
                      <span className="text-white/15">{reviewsDisplay}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 lg:gap-8">
                  <div>
                    <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_listings}+</span>
                    <span className="text-[10px] lg:text-[11px] text-white/25 ml-1.5">properties</span>
                  </div>
                  <div className="w-px h-5 bg-white/[0.1]" />
                  <div>
                    <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_reviews}+</span>
                    <span className="text-[10px] lg:text-[11px] text-white/25 ml-1.5">renters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Mosaic ── */}
      <div className="relative w-full lg:w-[45%] h-[50vh] sm:h-[55vh] lg:h-auto overflow-hidden">
        <div className={`absolute inset-4 sm:inset-6 lg:inset-8 xl:inset-10 2xl:inset-12 grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4 transition-all duration-1000 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}>
          {/* Large image — left column, spans 2 rows */}
          <div className="row-span-2 relative rounded-2xl overflow-hidden group">
            <img
              src={PROPERTY_IMAGES[0]}
              alt="Modern condo unit"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent opacity-60" />
          </div>

          {/* Top right */}
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={PROPERTY_IMAGES[1]}
              alt="City apartment"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent opacity-50" />
          </div>

          {/* Bottom right */}
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={PROPERTY_IMAGES[2]}
              alt="Furnished living space"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent opacity-50" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
