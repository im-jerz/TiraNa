const API_URL = import.meta.env.VITE_API_URL || ''

function getHeaders() {
  const token = localStorage.getItem('admin_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function api(path, options = {}) {
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, { headers: getHeaders(), ...options })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Request failed')
      return data
    } catch (err) {
      lastErr = err
      if (attempt === 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
        await new Promise(r => setTimeout(r, 500))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

// ── Auth ──

export async function adminLogin(username, password) {
  return api('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export async function adminRegister(username, email, password) {
  return api('/admin/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  })
}

export async function adminRegisterVerify(email, code) {
  return api('/admin/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  })
}

export async function verifyOTP(email, code, tempToken) {
  return api('/admin/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code, temp_token: tempToken })
  })
}

export async function changePassword(currentPassword, newPassword) {
  return api('/admin/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  })
}

export async function getAdminMe() {
  return api('/admin/auth/me')
}

// ── Host API Sync (New) ──

export async function getHostRooms({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/host/rooms?${params}`)
}

export async function hideHostRoom(id) {
  return api(`/admin/host/rooms/${id}/hide`, { method: 'POST' })
}

export async function showHostRoom(id) {
  return api(`/admin/host/rooms/${id}/show`, { method: 'POST' })
}

export async function getHostVerifications({ status = '', type = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (type) params.append('type', type)
  return api(`/admin/host/verifications?${params}`)
}

export async function getHostVerification(id) {
  return api(`/admin/host/verifications/${id}`)
}

export async function approveHostVerification(id) {
  return api(`/admin/host/verifications/${id}/approve`, { method: 'POST' })
}

export async function rejectHostVerification(id, reason) {
  const params = new URLSearchParams({ reason })
  return api(`/admin/host/verifications/${id}/reject?${params}`, { method: 'POST' })
}

export async function approveGuestVerification(id) {
  return api(`/admin/host/client/verifications/${id}/approve`, { method: 'POST' })
}

export async function rejectGuestVerification(id, reason) {
  const params = new URLSearchParams({ reason })
  return api(`/admin/host/client/verifications/${id}/reject?${params}`, { method: 'POST' })
}

// ── Public Stats (no auth) ──

export async function getPublicStats() {
  const defaults = { total_admins: 0, active_admins: 0, total_users: 0, total_bookings: 0, total_revenue: 0 }
  try {
    const res = await fetch(`${API_URL}/api/public/stats`)
    if (!res.ok) return defaults
    return res.json()
  } catch {
    return defaults
  }
}

// ── Dashboard Stats ──

export async function getDashboardStats({ period = 'monthly' } = {}) {
  const params = new URLSearchParams({ period })
  return api(`/admin/dashboard/stats?${params}`)
}

// ── Users ──

export async function getAdminUsers({ skip = 0, limit = 50, search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.append('search', search)
  return api(`/admin/users/?${params}`)
}

export async function deleteAdminUser(userId) {
  return api(`/admin/users/${userId}`, { method: 'DELETE' })
}

// ── Listings ──

export async function getListings({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/listings/?${params}`)
}

export async function getListingCount({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/listings/count?${params}`)
}

export async function approveListing(id) {
  return api(`/admin/listings/${id}/approve`, { method: 'POST', body: JSON.stringify({}) })
}

export async function rejectListing(id, reason) {
  return api(`/admin/listings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export async function suspendListing(id, reason) {
  return api(`/admin/listings/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Bookings ──

export async function getBookings({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/bookings/?${params}`)
}

export async function getBookingCount({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/bookings/count?${params}`)
}

export async function exportBookings({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${API_URL}/admin/bookings/export?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Export failed')
  return res.blob()
}

export async function cancelBooking(id, reason) {
  return api(`/admin/bookings/id/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Payments ──

export async function getPayments({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/payments/?${params}`)
}

export async function getPaymentCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/payments/count?${params}`)
}

export async function getRevenueStats() {
  return api('/admin/payments/revenue')
}

export async function refundPayment(id, amount, reason) {
  return api(`/admin/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  })
}

// ── Reviews ──

export async function getReviews({ skip = 0, limit = 50, search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.append('search', search)
  return api(`/admin/reviews/?${params}`)
}

export async function getReviewCount({ search = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  return api(`/admin/reviews/count?${params}`)
}

export async function hideReview(id) {
  return api(`/admin/reviews/${id}/hide`, { method: 'POST' })
}

export async function showReview(id) {
  return api(`/admin/reviews/${id}/show`, { method: 'POST' })
}

// ── Support Tickets ──

export async function getTickets({ skip = 0, limit = 50, status = '', priority = '', category = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  return api(`/admin/support/?${params}`)
}

export async function getTicketCount({ status = '', priority = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  return api(`/admin/support/count?${params}`)
}

export async function updateTicket(id, data) {
  return api(`/admin/support/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ── Disputes ──

export async function getDisputes({ skip = 0, limit = 50, status = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  return api(`/admin/disputes/?${params}`)
}

export async function getDisputeCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/disputes/count?${params}`)
}

export async function updateDispute(id, data) {
  return api(`/admin/disputes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ── Withdrawals ──

export async function getWithdrawals({ skip = 0, limit = 50, status = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  return api(`/admin/withdrawals/?${params}`)
}

export async function getWithdrawalCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/withdrawals/count?${params}`)
}

export async function approveWithdrawal(id) {
  return api(`/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify({}) })
}

export async function rejectWithdrawal(id, reason) {
  return api(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Settings ──

export async function getSettings() {
  return api('/admin/settings/')
}

export async function updateSetting(key, value, description) {
  return api(`/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value, description }),
  })
}

// ── Admin Management ──

export async function getAdmins() {
  return api('/admin/management/')
}

export async function createAdmin(username, email, password) {
  return api('/admin/management/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export async function inviteAdmin(username, email) {
  return api('/admin/management/invite', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  })
}

export async function acceptInvite(email, code, password) {
  return api('/admin/auth/accept-invite', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  })
}

export async function updateAdmin(id, data) {
  return api(`/admin/management/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteAdmin(id) {
  return api(`/admin/management/${id}`, { method: 'DELETE' })
}

// ── Audit Log ──

export async function getAuditLogs({ skip = 0, limit = 100, action = '', admin_username = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (action) params.append('action', action)
  if (admin_username) params.append('admin_username', admin_username)
  return api(`/admin/audit/?${params}`)
}
