import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'

const API = 'http://localhost:5000/api/notifications'

function BellIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function BookingIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function PaymentIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function VerificationIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

const typeIcons = {
  booking: BookingIcon,
  payment: PaymentIcon,
  review: ReviewIcon,
  system: SystemIcon,
  message: MessageIcon,
  verification: VerificationIcon,
}

const typeColors = {
  booking: 'text-blue-500 bg-blue-50',
  payment: 'text-teal bg-teal/10',
  review: 'text-yellow-500 bg-yellow-50',
  system: 'text-purple-500 bg-purple-50',
  message: 'text-sage bg-sage/10',
  verification: 'text-orange-500 bg-orange-50',
}

const typeLabels = {
  booking: 'Booking',
  payment: 'Payment',
  review: 'Review',
  system: 'System',
  message: 'Message',
  verification: 'Verification',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 sm:p-5 border border-gray-100 animate-pulse">
      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-2 w-2 rounded-full bg-gray-100" />
        </div>
        <div className="h-3 bg-gray-50 rounded w-full mt-2" />
        <div className="h-3 bg-gray-50 rounded w-3/4 mt-1" />
        <div className="flex items-center gap-3 mt-3">
          <div className="h-3 bg-gray-50 rounded w-16" />
          <div className="h-3 bg-gray-50 rounded w-20" />
        </div>
      </div>
    </div>
  )
}

function NotificationModal({ notification, onClose, onMarkRead }) {
  useEffect(() => {
    if (notification && !notification.is_read) {
      onMarkRead(notification.id)
    }
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [notification, onClose, onMarkRead])

  if (!notification) return null

  const Icon = typeIcons[notification.type] || SystemIcon
  const colorClass = typeColors[notification.type] || typeColors.system

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full max-w-lg shadow-xl animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${colorClass}`}>
              <Icon />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-charcoal">{notification.title}</h2>
              <span className="text-[11px] text-gray-400 capitalize">{typeLabels[notification.type] || notification.type}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none p-1 cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{notification.message}</p>
        </div>

        <div className="px-5 pb-5 flex items-center justify-between text-[11px] text-gray-400">
          <span>{formatFullDate(notification.created_at)}</span>
          {notification.sender_username && (
            <span>from @{notification.sender_username}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Notifications() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const searchTimeout = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin')
      return
    }
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    fetchNotifications()
  }, [navigate])

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (readFilter) params.set('read', readFilter)

      const res = await fetch(`${API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/client/signin')
          return
        }
        throw new Error('Failed to load notifications')
      }
      const data = await res.json()
      setNotifications(data.notifications)
      setPagination(data.pagination)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, readFilter, navigate])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchNotifications(1)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [search, typeFilter, readFilter, fetchNotifications])

  async function handleMarkRead(id) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setSelectedNotification(prev =>
        prev && prev.id === id ? { ...prev, is_read: true } : prev
      )
      window.dispatchEvent(new Event('notifications-updated'))
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      window.dispatchEvent(new Event('notifications-updated'))
    } catch {
      // ignore
    }
  }

  async function handleDelete(id) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      if (selectedNotification?.id === id) setSelectedNotification(null)
    } catch {
      // ignore
    }
  }

  function openNotification(n) {
    setSelectedNotification(n)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const hasFilters = search || typeFilter || readFilter

  function clearFilters() {
    setSearch('')
    setTypeFilter('')
    setReadFilter('')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex-1">
      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto">
              {pagination.total} {pagination.total === 1 ? 'notification' : 'notifications'}
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>
        </div>
      </section>

      <section className="pt-16 sm:pt-20 pb-8 sm:pb-10 -mt-10 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search and Filters */}
          <div className="bg-white border border-gray-100 p-4 mb-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 text-charcoal placeholder-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 text-charcoal focus:outline-none focus:border-sage cursor-pointer"
              >
                <option value="">All types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 text-charcoal focus:outline-none focus:border-sage cursor-pointer"
              >
                <option value="">All status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-sage hover:text-olive transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Clear filters
                </button>
              )}

              <div className="flex-1" />

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-sage hover:text-olive transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <BellIcon className="w-8 h-8 text-gray-300" />
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {hasFilters ? 'No notifications match your filters' : 'No notifications yet'}
              </p>
              <p className="text-gray-300 text-xs mt-1">
                {hasFilters ? 'Try adjusting your search or filters' : 'When you get notifications, they will appear here.'}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-xs font-medium text-sage hover:text-olive transition-colors bg-transparent border-none cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const Icon = typeIcons[n.type] || SystemIcon
                const colorClass = typeColors[n.type] || typeColors.system
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`flex items-start gap-4 p-4 sm:p-5 transition-all cursor-pointer ${
                      n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-sage/[0.03] hover:bg-sage/[0.06]'
                    } border border-gray-100 hover:border-gray-200 relative group`}
                  >
                    <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${colorClass}`}>
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm ${n.is_read ? 'font-medium text-gray-600' : 'font-semibold text-charcoal'}`}>
                          {n.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-sage" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all border-none bg-transparent p-0 cursor-pointer"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-400">{formatDate(n.created_at)}</span>
                        {n.sender_username && (
                          <span className="text-[11px] text-gray-300">from @{n.sender_username}</span>
                        )}
                        <span className="text-[11px] text-gray-300 capitalize">{n.type}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                type="button"
                onClick={() => fetchNotifications(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <ChevronLeftIcon />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (pagination.totalPages <= 7) return true
                  if (p === 1 || p === pagination.totalPages) return true
                  if (Math.abs(p - pagination.page) <= 1) return true
                  return false
                })
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">...</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => fetchNotifications(p)}
                      className={`w-9 h-9 text-sm font-medium transition-colors border cursor-pointer ${
                        p === pagination.page
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'bg-transparent text-charcoal border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                type="button"
                onClick={() => fetchNotifications(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>
      </section>
      </div>

      <NotificationModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={handleMarkRead}
      />

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Notifications
