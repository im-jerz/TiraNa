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

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
]

const TYPING_WORDS = ['Manila', 'Cebu', 'Davao', 'Baguio', 'Tagaytay', 'Subic']

function TypingText() {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = TYPING_WORDS[wordIndex]
    let timeout

    if (!isDeleting && text === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), 2000)
    } else if (isDeleting && text === '') {
      setIsDeleting(false)
      setWordIndex((prev) => (prev + 1) % TYPING_WORDS.length)
    } else {
      timeout = setTimeout(() => {
        setText(isDeleting ? currentWord.slice(0, text.length - 1) : currentWord.slice(0, text.length + 1))
      }, isDeleting ? 50 : 100)
    }

    return () => clearTimeout(timeout)
  }, [text, isDeleting, wordIndex])

  return (
    <span className="text-sage inline-block min-w-[4ch]">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  )
}

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

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
    function handleMouse(e) {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
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

  const ratingDisplay = siteStats.average_rating
    ? siteStats.average_rating.toFixed(1)
    : ''

  return (
    <section className="relative min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden">

      {/* ── Background Layer ── */}
      <div className="absolute inset-0 bg-charcoal">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sage/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-teal/[0.08] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-olive/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* ── LEFT ── */}
      <div className="relative w-full lg:w-[55%] flex z-10">
        <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28 pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-16">
          <div className={`w-full max-w-[600px] 2xl:max-w-[680px] transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

            {/* Eyebrow — minimal line */}
            <div className={`flex items-center gap-3 mb-8 lg:mb-10 transition-all duration-700 delay-100 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-8 h-[1.5px] bg-sage/50" />
              <span className="text-[10px] sm:text-[11px] text-sage/70 font-medium uppercase tracking-[0.25em]">TiraNa</span>
            </div>

            {/* Headline — typewriter style */}
            <div className={`relative mb-5 lg:mb-6 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <h1 className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.3rem] 2xl:text-[4.8rem] font-bold text-white leading-[1.1] tracking-[-0.02em]">
                Hanap ng Tahanan<br />
                sa <TypingText />?
              </h1>
            </div>

            {/* Subheadline */}
            <p className={`text-sm sm:text-[15px] lg:text-base text-white/35 leading-relaxed mb-12 lg:mb-14 max-w-md font-light transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              Apartments, condos, at bahay na for rent sa buong Pilipinas. Piliin ang lungsod mo at simulan ang hanap.
            </p>

            {/* ── SEARCH BAR ── */}
            <div className={`transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  {/* Animated gradient ring */}
                  <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-sage/40 via-teal/40 to-sage/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-[1px] transition-opacity duration-500" />
                  <div className="relative flex items-center bg-charcoal/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/[0.06]">
                    <div className="pl-6 pr-2 py-4 lg:py-5">
                      <svg className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-sage/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Saan gusto mo mag-rent?"
                      className="flex-1 bg-transparent text-white placeholder-white/25 focus:outline-none text-[15px] lg:text-[15px] py-4 lg:py-5 pr-2 font-light"
                    />
                    <button
                      type="submit"
                      className="m-2 px-6 lg:px-7 py-3 lg:py-3.5 bg-sage hover:bg-sage/80 text-white font-medium text-sm rounded-xl flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97]"
                    >
                      <span>Hanapin</span>
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>

              {/* Trending — minimal */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5 lg:mt-6">
                <span className="text-[10px] text-white/15 uppercase tracking-[0.15em] font-medium">Sikat:</span>
                {locations.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSuggestionClick(d)}
                    className="text-[12px] lg:text-[13px] text-white/25 hover:text-sage transition-all duration-300 font-light"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Proof + Stats */}
            <div ref={counterRef} className={`mt-14 lg:mt-20 transition-all duration-700 delay-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-7 sm:gap-12">
                {/* Avatars + Rating */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2.5">
                    {reviewers.map((r) => (
                      <div key={r.user_id} className="w-9 h-9 lg:w-10 lg:h-10 rounded-full ring-2 ring-charcoal overflow-hidden">
                        {r.avatar ? (
                          <img
                            src={r.avatar.startsWith('http') ? r.avatar : `${CLIENT_API_URL}${r.avatar}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-sage/20 flex items-center justify-center text-[10px] font-semibold text-sage">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full ring-2 ring-charcoal bg-sage/70 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">+</span>
                    </div>
                  </div>
                  {ratingDisplay && (
                    <div className="flex items-center gap-2 text-xs text-white/35">
                      <span className="text-amber-400 text-[11px] tracking-tight">★★★★★</span>
                      <span className="text-white/60 font-medium tabular-nums">{ratingDisplay}</span>
                    </div>
                  )}
                </div>

                <div className="hidden sm:block w-px h-6 bg-white/[0.08]" />

                {/* Stats */}
                <div className="flex items-center gap-7 lg:gap-9">
                  <div>
                    <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_listings}+</span>
                    <span className="text-[10px] lg:text-[11px] text-white/20 ml-1.5 font-light">properties</span>
                  </div>
                  <div className="w-px h-5 bg-white/[0.08]" />
                  <div>
                    <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_reviews}+</span>
                    <span className="text-[10px] lg:text-[11px] text-white/20 ml-1.5 font-light">renters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent shape — parallax */}
        <div
          className="hidden lg:block absolute top-[15%] right-0 w-48 h-48 pointer-events-none transition-transform duration-[2000ms] ease-out"
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
        >
          <div className="w-full h-full rounded-full border border-sage/[0.08] bg-sage/[0.02]" />
        </div>
        <div
          className="hidden lg:block absolute bottom-[20%] right-[10%] w-24 h-24 pointer-events-none transition-transform duration-[2000ms] ease-out"
          style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }}
        >
          <div className="w-full h-full rounded-full bg-teal/[0.04]" />
        </div>
      </div>

      {/* ── RIGHT: Mosaic ── */}
      <div className="relative w-full lg:w-[45%] h-[50vh] sm:h-[55vh] lg:h-auto overflow-hidden">
        <div className={`absolute inset-4 sm:inset-6 lg:inset-8 xl:inset-10 2xl:inset-12 grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4 transition-all duration-[1200ms] delay-300 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}>

          {/* Large image — left column, spans 2 rows */}
          <div className="row-span-2 relative rounded-[1.25rem] overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent z-10" />
            <img
              src={PROPERTY_IMAGES[0]}
              alt="Modern condo unit"
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-white/[0.06] z-20 pointer-events-none" />
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20">
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-3.5 h-3.5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] text-sage/80 uppercase tracking-wider font-medium">Manila</span>
              </div>
              <p className="text-white text-sm sm:text-base font-semibold">Luxury Condo Unit</p>
            </div>
            {/* Hover border glow */}
            <div className="absolute inset-0 rounded-[1.25rem] border border-transparent group-hover:border-sage/20 transition-colors duration-500 z-20 pointer-events-none" />
          </div>

          {/* Top right */}
          <div className="relative rounded-[1.25rem] overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent z-10" />
            <img
              src={PROPERTY_IMAGES[1]}
              alt="City apartment"
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-white/[0.06] z-20 pointer-events-none" />
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-sage/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] text-white/70 font-medium">Cebu</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-[1.25rem] border border-transparent group-hover:border-sage/20 transition-colors duration-500 z-20 pointer-events-none" />
          </div>

          {/* Bottom right */}
          <div className="relative rounded-[1.25rem] overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent z-10" />
            <img
              src={PROPERTY_IMAGES[2]}
              alt="Furnished living space"
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-white/[0.06] z-20 pointer-events-none" />
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-sage/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] text-white/70 font-medium">Davao</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-[1.25rem] border border-transparent group-hover:border-sage/20 transition-colors duration-500 z-20 pointer-events-none" />
          </div>
        </div>

        {/* Decorative frame corners */}
        <div className="hidden lg:block absolute top-6 left-6 w-8 h-8 border-t border-l border-sage/20 rounded-tl-lg pointer-events-none" />
        <div className="hidden lg:block absolute bottom-6 right-6 w-8 h-8 border-b border-r border-sage/20 rounded-br-lg pointer-events-none" />
      </div>
    </section>
  )
}

export default Hero
