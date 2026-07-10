const CLIENT_API_URL = import.meta.env.VITE_CLIENT_API_URL || 'http://localhost:5000'

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const res = await fetch(`${CLIENT_API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || `Client API error: ${res.status}`)
  }

  return res.json()
}

export async function getUsers({ search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.set('search', search)
  const result = await api(`/api/admin/users?${params}`)
  if (result && result.users) {
    return result.users.map(u => ({ ...u, role: 'Client' }))
  }
  return []
}

export async function getUser(userId) {
  const result = await api(`/api/admin/users/${userId}`)
  return result.user || null
}

export async function getVerifications({ status = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  const result = await api(`/api/admin/verifications?${params}`)
  if (result && result.verifications) {
    return result.verifications.map(v => ({
      ...v,
      type: 'client',
      id_front_url: v.id_front_url && !v.id_front_url.startsWith('http')
        ? `${CLIENT_API_URL}${v.id_front_url}`
        : v.id_front_url || '',
      id_back_url: v.id_back_url && !v.id_back_url.startsWith('http')
        ? `${CLIENT_API_URL}${v.id_back_url}`
        : v.id_back_url || '',
    }))
  }
  return []
}

export async function approveVerification(userId) {
  return api(`/api/admin/verifications/${userId}/approve`, { method: 'POST' })
}

export async function rejectVerification(userId, reason = '') {
  return api(`/api/admin/verifications/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getBookings({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const result = await api(`/api/admin/bookings?${params}`)
  return result.data || []
}

export async function getBookingCount(status = '') {
  const params = {}
  if (status) params.status = status
  const qs = new URLSearchParams(params).toString()
  const result = await api(`/api/admin/bookings/count${qs ? `?${qs}` : ''}`)
  return result.count || 0
}

export async function getBookingTrend(period = 'monthly') {
  const result = await api(`/api/admin/bookings/trend?period=${period}`)
  return result.data || []
}

export async function getPayments({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const result = await api(`/api/admin/payments?${params}`)
  return result.data || []
}

export async function getPaymentCount(status = '') {
  const params = {}
  if (status) params.status = status
  const qs = new URLSearchParams(params).toString()
  const result = await api(`/api/admin/payments/count${qs ? `?${qs}` : ''}`)
  return result.count || 0
}

export async function getRevenueStats() {
  const result = await api('/api/admin/payments/revenue')
  return result || { total_revenue: 0, total_refunded: 0 }
}

export async function getReviews({ page = 1, limit = 50, search = '', hidden = '' } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (search) params.set('search', search)
  if (hidden) params.set('hidden', hidden)
  const result = await api(`/api/admin/reviews?${params}`)
  return result || { data: [], total: 0 }
}

export async function toggleReviewVisibility(reviewId) {
  return api(`/api/admin/reviews/${reviewId}/toggle-hide`, { method: 'POST' })
}

export async function getRevenueTrend(period = 'monthly') {
  const result = await api(`/api/admin/revenue/trend?period=${period}`)
  return result.data || []
}

const ADMIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export async function getDashboardStats(period = 'monthly') {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${ADMIN_API_URL}/admin/dashboard/stats?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`)
  return res.json()
}
