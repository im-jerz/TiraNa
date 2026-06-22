import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Properties', path: '/properties' },
  { label: 'About', path: '/about' },
]

function UserCircleIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

const signedInLinks = [
  { label: 'My Bookings', path: '/bookings' },
  { label: 'Saved', path: '/saved' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Profile', path: '/client/profile' },
]

function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [role, setRole] = useState('guest')
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [scrolled, setScrolled] = useState(window.scrollY > 20)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return

    async function fetchUnread() {
      try {
        const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount)
        }
      } catch {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSignOut() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const t = !scrolled

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              className={`text-lg sm:text-xl font-bold tracking-widest uppercase transition-colors shrink-0 ${
                t ? 'text-white hover:text-sage' : 'text-charcoal hover:text-sage'
              }`}
            >
              TiraNa
            </Link>
          </div>

          <nav className="hidden sm:flex flex-1 items-center justify-center gap-6">
            {navLinks.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm font-medium transition-colors ${
                  pathname === path
                    ? 'text-sage'
                    : t
                      ? 'text-white/70 hover:text-white'
                      : 'text-gray-500 hover:text-charcoal'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-1.5">
            {user ? (
              <>
                <Link
                  to="/client/notifications"
                  className={`relative flex items-center justify-center p-1.5 sm:p-2 transition-colors rounded ${
                    t
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
                  }`}
                  title="Notifications"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

              <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(prev => !prev)}
                    className={`flex items-center justify-center p-1.5 sm:p-2 transition-colors rounded ${
                      t
                        ? 'text-white/70 hover:text-white hover:bg-white/10'
                        : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
                    }`}
                    title="Menu"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded shadow-xl border border-gray-100 overflow-hidden z-50">
                      {signedInLinks.map(({ label, path }) => (
                        <Link
                          key={path}
                          to={path}
                          onClick={() => setUserMenuOpen(false)}
                          className={`block px-4 py-2.5 text-sm transition-colors ${
                            pathname === path
                              ? 'text-sage bg-sage/5 font-medium'
                              : 'text-gray-600 hover:text-charcoal hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`h-5 w-px mx-0.5 ${t ? 'bg-white/20' : 'bg-gray-200'}`} />

                <button
                  onClick={handleSignOut}
                className={`inline-flex items-center text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors rounded ${
                  t
                    ? 'bg-white text-charcoal hover:bg-gray-100'
                    : 'bg-charcoal text-white hover:bg-charcoal/80'
                }`}
              >
                <span className="max-sm:hidden">Sign Out</span>
                <svg className="sm:hidden w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
              </>
            ) : (
              <>
                <div
                  className={`flex items-center text-[10px] sm:text-xs uppercase tracking-wider rounded ${
                    t ? 'border border-white/20' : 'border border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setRole('guest')}
                    className={`px-1.5 sm:px-2.5 py-1 transition-colors rounded ${
                      role === 'guest'
                        ? t
                          ? 'bg-white text-charcoal'
                          : 'bg-charcoal text-white'
                        : t
                          ? 'text-white/50 hover:text-white'
                          : 'text-gray-400 hover:text-charcoal'
                    }`}
                  >
                    G
                  </button>
                  <button
                    onClick={() => setRole('host')}
                    className={`px-1.5 sm:px-2.5 py-1 transition-colors rounded ${
                      role === 'host'
                        ? t
                          ? 'bg-white text-charcoal'
                          : 'bg-charcoal text-white'
                        : t
                          ? 'text-white/50 hover:text-white'
                          : 'text-gray-400 hover:text-charcoal'
                    }`}
                  >
                    H
                  </button>
                </div>

                <span className={`max-sm:hidden ${t ? 'text-white/20' : 'text-gray-200'}`}>|</span>

                {role === 'guest' ? (
                  <Link
                    to="/client/signup"
                    replace
                    className={`max-sm:hidden text-xs sm:text-sm font-medium transition-colors ${
                      t ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-charcoal'
                    }`}
                  >
                    Sign Up
                  </Link>
                ) : (
                  <Link
                    to="http://localhost:5174/signup"
                    replace
                    className={`max-sm:hidden text-xs sm:text-sm font-medium transition-colors ${
                      t ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-charcoal'
                    }`}
                  >
                    Sign Up
                  </Link>
                )}

                {role === 'guest' ? (
                  <Link
                    to="/client/signin"
                    replace
                    className={`inline-flex items-center text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors rounded ${
                      t
                        ? 'bg-white text-charcoal hover:bg-gray-100'
                        : 'bg-charcoal text-white hover:bg-charcoal/80'
                    }`}
                  >
                    Sign In
                  </Link>
                ) : (
                  <Link
                    to="http://localhost:5174/signin"
                    replace
                    className={`inline-flex items-center text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors rounded ${
                      t
                        ? 'bg-white text-charcoal hover:bg-gray-100'
                        : 'bg-charcoal text-white hover:bg-charcoal/80'
                    }`}
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile FAB */}
      <div ref={menuRef} className="sm:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {menuOpen && (
          <div className="bg-white rounded shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            {navLinks.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`block px-5 py-3 text-sm font-medium transition-colors ${
                  pathname === path
                    ? 'text-sage bg-sage/5'
                    : 'text-gray-600 hover:text-charcoal hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            menuOpen ? 'bg-charcoal rotate-45' : 'bg-sage'
          } text-white`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </>
  )
}

export default Header
