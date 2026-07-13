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
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
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
    <section className="relative min-h-[100dvh] overflow-hidden bg-charcoal">

      {/* ── Background Layer ── */}
      <div className="absolute inset-0">

        {/* Vertical accent lines — architectural rhythm */}
        <div
          className="absolute top-0 right-[22%] w-px h-full pointer-events-none transition-transform duration-[2000ms] ease-out"
          style={{ transform: `translateY(${mousePos.y * 0.3}px)` }}
        >
          <div className="w-px h-full bg-gradient-to-b from-transparent via-sage/[0.06] to-transparent" />
        </div>
        <div
          className="absolute top-0 right-[45%] w-px h-full pointer-events-none transition-transform duration-[2000ms] ease-out hidden lg:block"
          style={{ transform: `translateY(${mousePos.y * -0.2}px)` }}
        >
          <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
        </div>

        {/* Dot grid pattern — subtle, modern */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none transition-transform duration-[2000ms] ease-out"
          style={{ transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)` }}
        >
          <div className="absolute top-[12%] left-[8%] opacity-[0.04]">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              {[...Array(36)].map((_, i) => (
                <circle key={i} cx={(i % 6) * 24} cy={Math.floor(i / 6) * 24} r="1" fill="#9CB080" />
              ))}
            </svg>
          </div>
        </div>

        {/* ── RIGHT SIDE: Primary Visual Anchor — large sage ring ── */}
        <div
          className="absolute top-[18%] right-[6%] w-[340px] h-[340px] xl:w-[420px] xl:h-[420px] pointer-events-none transition-transform duration-[2000ms] ease-out hidden lg:block"
          style={{ transform: `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)` }}
        >
          <div className="w-full h-full rounded-full border border-sage/[0.06]" />
          <div className="absolute inset-6 rounded-full border border-sage/[0.04]" />
          <div className="absolute inset-12 rounded-full border border-sage/[0.03]" />
        </div>

        {/* ── RIGHT SIDE: Abstract data network — map-like connected dots ── */}
        <svg
          className="absolute bottom-[12%] right-[5%] w-[280px] h-[200px] pointer-events-none opacity-[0.06] hidden lg:block"
          viewBox="0 0 280 200"
          fill="none"
          style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }}
        >
          {/* Connection lines */}
          <line x1="40" y1="60" x2="120" y2="30" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="120" y1="30" x2="200" y2="80" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="200" y1="80" x2="260" y2="40" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="120" y1="30" x2="160" y2="140" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="160" y1="140" x2="80" y2="160" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="160" y1="140" x2="240" y2="170" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="80" y1="160" x2="40" y2="60" stroke="#9CB080" strokeWidth="0.5" />
          <line x1="200" y1="80" x2="240" y2="170" stroke="#9CB080" strokeWidth="0.5" />
          {/* Nodes */}
          <circle cx="40" cy="60" r="3" fill="#9CB080" />
          <circle cx="120" cy="30" r="4" fill="#9CB080" />
          <circle cx="200" cy="80" r="3" fill="#9CB080" />
          <circle cx="260" cy="40" r="2.5" fill="#9CB080" />
          <circle cx="160" cy="140" r="3.5" fill="#9CB080" />
          <circle cx="80" cy="160" r="2.5" fill="#9CB080" />
          <circle cx="240" cy="170" r="3" fill="#9CB080" />
        </svg>

        {/* ── RIGHT SIDE: Vertical bar chart — abstract listing density ── */}
        <div
          className="absolute top-[35%] right-[2%] flex items-end gap-[5px] pointer-events-none opacity-[0.05] hidden xl:block"
          style={{ transform: `translateY(${mousePos.y * -0.4}px)` }}
        >
          {[40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 75, 42].map((h, i) => (
            <div
              key={i}
              className="w-[3px] bg-sage rounded-full"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* ── RIGHT SIDE: Large watermark typography — architectural depth ── */}
        <div className="absolute top-[6%] right-[-1%] pointer-events-none select-none hidden xl:block">
          <span className="text-[16rem] 2xl:text-[20rem] font-bold text-white/[0.02] leading-none tracking-tighter">
            HOME
          </span>
        </div>
        <div
          className="absolute bottom-[8%] right-[3%] pointer-events-none select-none hidden xl:block transition-transform duration-[2000ms] ease-out"
          style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)` }}
        >
          <span className="text-[8rem] xl:text-[10rem] font-bold text-sage/[0.03] leading-none tracking-tighter">
            RENT
          </span>
        </div>

        {/* ── RIGHT SIDE: Rotated vertical text — editorial accent ── */}
        <div className="absolute top-[50%] right-[1.5%] -translate-y-1/2 pointer-events-none hidden 2xl:block">
          <span
            className="text-[11px] text-sage/[0.08] font-medium uppercase tracking-[0.35em] whitespace-nowrap"
            style={{ writingMode: 'vertical-rl' }}
          >
            Find your home
          </span>
        </div>

        {/* Geometric accent — thin angular shape */}
        <div
          className="absolute bottom-[15%] right-[8%] w-32 h-32 pointer-events-none transition-transform duration-[2000ms] ease-out hidden lg:block"
          style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)` }}
        >
          <div className="w-full h-full border border-sage/[0.07] rotate-12" />
        </div>

        {/* Floating parallelogram accent */}
        <div
          className="absolute top-[20%] left-[5%] w-20 h-12 pointer-events-none transition-transform duration-[2000ms] ease-out hidden lg:block"
          style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px) skewX(-12deg)` }}
        >
          <div className="w-full h-full bg-teal/[0.04]" />
        </div>
      </div>

      {/* ── HERO IMAGE — bleeds from left, extends behind text (desktop only) ── */}
      <div
        className={`absolute top-[8%] left-0 w-[58%] h-[84%] transition-all duration-[1400ms] ease-[cubic-bezier(0.32,0.72,0,1)] hidden lg:block ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
      >
        <div className="absolute inset-0 rounded-r-[2rem] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-charcoal/95 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-charcoal/20 z-10" />
          <img
            src={PROPERTY_IMAGES[0]}
            alt="Modern condo unit"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-3 sm:inset-5 rounded-r-[1.5rem] border border-white/[0.04] z-20 pointer-events-none" />
        </div>

        <div
          className={`absolute -bottom-8 -right-12 w-[55%] h-[45%] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 transition-all duration-[1200ms] delay-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent z-10" />
          <img
            src={PROPERTY_IMAGES[1]}
            alt="City apartment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] rounded-2xl z-20 pointer-events-none" />
          <div className="absolute bottom-3 left-4 z-20">
            <div className="flex items-center gap-1.5 bg-charcoal/60 backdrop-blur-sm rounded-full px-3 py-1.5">
              <svg className="w-3 h-3 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[10px] text-white/80 font-medium">Cebu</span>
            </div>
          </div>
        </div>

        <div
          className={`absolute -top-4 -right-20 w-[38%] h-[32%] rounded-xl overflow-hidden shadow-xl shadow-black/20 transition-all duration-[1200ms] delay-500 ease-[cubic-bezier(0.32,0.72,0,1)] hidden lg:block ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent z-10" />
          <img
            src={PROPERTY_IMAGES[2]}
            alt="Furnished living space"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] rounded-xl z-20 pointer-events-none" />
          <div className="absolute bottom-2 left-3 z-20">
            <div className="flex items-center gap-1.5 bg-charcoal/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <svg className="w-2.5 h-2.5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[9px] text-white/80 font-medium">Davao</span>
            </div>
          </div>
        </div>

        <div
          className="absolute top-[20%] left-[30%] w-[200%] h-px bg-gradient-to-r from-transparent via-sage/[0.12] to-transparent pointer-events-none rotate-[-8deg] transition-transform duration-[2000ms] ease-out"
          style={{ transform: `rotate(-8deg) translateX(${mousePos.x * 0.2}px)` }}
        />
      </div>

      {/* ── CONTENT CANVAS — distributed across the viewport ── */}
      <div className="relative z-10 min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-y-0 lg:gap-x-8">

        {/* ── ZONE 1: Headline + Subheadline — top-left ── */}
        <div className={`lg:col-start-1 lg:col-span-7 lg:row-start-1 px-5 sm:px-8 lg:pl-14 xl:pl-20 2xl:pl-28 lg:pr-8 pt-24 sm:pt-28 lg:pt-[12vh] xl:pt-[14vh] transition-all duration-700 delay-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3 mb-5 lg:mb-8">
            <div className="w-8 lg:w-10 h-[1.5px] bg-gradient-to-r from-sage/60 to-transparent" />
            <span className="text-[10px] sm:text-[11px] text-sage/70 font-medium uppercase tracking-[0.25em]">TiraNa</span>
          </div>

          <div className={`relative mb-4 lg:mb-5 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-[2rem] sm:text-[2.6rem] md:text-[3rem] lg:text-[3.6rem] xl:text-[4.1rem] 2xl:text-[4.6rem] leading-[1.08] tracking-[-0.025em]">
              <span className="text-white/60 font-light block">Hanap ng</span>
              <span className="text-white font-bold">Tahanan</span>
              <br />
              <span className="text-white/60 font-light">sa </span>
              <TypingText />
              <span className="text-white/60 font-light">?</span>
            </h1>
          </div>

          <p className={`text-[13px] sm:text-[15px] lg:text-base text-white/55 leading-relaxed max-w-md font-light transition-all duration-700 delay-[400ms] ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Apartments, condos, at bahay na for rent sa buong Pilipinas. Piliin ang lungsod mo at simulan ang hanap.
          </p>
        </div>

        {/* ── ZONE 2: Search Bar — center, wide, isolated ── */}
        <div className={`lg:col-start-1 lg:col-span-8 lg:row-start-2 flex items-end px-5 sm:px-8 lg:pl-14 xl:pl-20 2xl:pl-28 lg:pr-12 pb-12 sm:pb-16 lg:pb-0 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="w-full lg:max-w-[640px]">
            <form onSubmit={handleSearch}>
              <div className="relative group">
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
                    className="flex-1 bg-transparent text-white placeholder-white/35 focus:outline-none text-[15px] lg:text-[15px] py-4 lg:py-5 pr-2 font-light"
                  />
                    <button
                      type="submit"
                      className="m-2 px-5 sm:px-6 lg:px-7 py-3 lg:py-3.5 bg-sage hover:bg-sage/80 text-white font-medium text-sm rounded-xl flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97]"
                    >
                    <span>Hanapin</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5 lg:mt-6">
              <span className="text-[10px] text-white/35 uppercase tracking-[0.15em] font-medium">Sikat:</span>
              {locations.slice(0, 4).map((d) => (
                <button
                  key={d}
                  onClick={() => handleSuggestionClick(d)}
                  className="text-[12px] lg:text-[13px] text-white/45 hover:text-sage transition-all duration-300 font-light"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ZONE 3: Stats + Social Proof — bottom-left ── */}
        <div ref={counterRef} className={`lg:col-start-1 lg:col-span-7 lg:row-start-3 px-5 sm:px-8 lg:pl-14 xl:pl-20 2xl:pl-28 lg:pr-8 pb-8 sm:pb-10 lg:pb-14 transition-all duration-700 delay-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-10">
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
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="text-amber-400 text-[11px] tracking-tight">★★★★★</span>
                  <span className="text-white/70 font-medium tabular-nums">{ratingDisplay}</span>
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px h-6 bg-white/[0.08]" />

            <div className="flex items-center gap-7 lg:gap-9">
              <div>
                <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_listings}+</span>
                <span className="text-[10px] lg:text-[11px] text-white/40 ml-1.5 font-light">properties</span>
              </div>
              <div className="w-px h-5 bg-white/[0.08]" />
              <div>
                <span className="text-lg lg:text-xl font-bold text-white tabular-nums">{siteStats.total_reviews}+</span>
                <span className="text-[10px] lg:text-[11px] text-white/40 ml-1.5 font-light">renters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Decorative frame corners — right side framing ── */}
      <div className="hidden lg:block absolute top-8 right-8 w-10 h-10 border-t border-r border-sage/[0.15] rounded-tr-lg pointer-events-none z-20" />
      <div className="hidden lg:block absolute bottom-8 right-8 w-10 h-10 border-b border-r border-sage/[0.15] rounded-br-lg pointer-events-none z-20" />
      {/* Inner L-bracket — top right */}
      <div className="hidden xl:block absolute top-16 right-16 w-6 h-6 border-t border-r border-sage/[0.08] pointer-events-none z-20" />
      {/* Bottom edge line — anchors the right side */}
      <div className="hidden lg:block absolute bottom-0 right-0 w-[45%] h-px bg-gradient-to-l from-sage/[0.08] to-transparent pointer-events-none z-20" />
    </section>
  )
}

export default Hero
