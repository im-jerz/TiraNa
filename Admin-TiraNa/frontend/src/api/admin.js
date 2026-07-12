const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5002')

async function api(path, options = {}) {
  const token = localStorage.getItem('admin_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || `Request failed: ${res.status}`)
  }

  return res.json()
}

export async function adminLogin(username, password) {
  return api('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function verifyOtp(email, code, tempToken) {
  return api('/admin/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code, temp_token: tempToken }),
  })
}

export async function getPublicStats() {
  return api('/api/public/stats')
}

export async function getUsers({ search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.set('search', search)
  return api(`/admin/users/?${params}`)
}

export async function deleteUser(userId, role = '') {
  const params = role ? `?role=${role}` : ''
  return api(`/admin/users/${userId}${params}`, { method: 'DELETE' })
}

export async function getVerifications({ status = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  return api(`/admin/verifications/?${params}`)
}

export async function approveVerification(verificationId) {
  return api(`/admin/verifications/${verificationId}/approve`, { method: 'POST' })
}

export async function rejectVerification(verificationId, reason = '') {
  return api(`/admin/verifications/${verificationId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getRooms({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return api(`/admin/rooms/?${params}`)
}

export async function updateRoomStatus(roomId, status) {
  return api(`/admin/rooms/${roomId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export async function getAdmins() {
  return api('/admin/management/')
}

export async function getAdminCount() {
  return api('/admin/management/count')
}

export async function createAdmin({ username, email, password }) {
  return api('/admin/management/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export async function updateAdmin(adminId, data) {
  return api(`/admin/management/${adminId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAdmin(adminId) {
  return api(`/admin/management/${adminId}`, { method: 'DELETE' })
}

export async function getSettings() {
  return api('/admin/settings/')
}

export async function updateSetting(key, value) {
  return api(`/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  })
}

export async function getAuditLogs({ action = '', admin_username = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (action) params.set('action', action)
  if (admin_username) params.set('admin_username', admin_username)
  return api(`/admin/audit/?${params}`)
}

export async function getMyProfile() {
  return api('/admin/auth/me')
}

export async function updateMyProfile({ username, email }) {
  return api('/admin/auth/me', {
    method: 'PUT',
    body: JSON.stringify({ username, email }),
  })
}

export async function changePassword({ current_password, new_password }) {
  return api('/admin/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ current_password, new_password }),
  })
}

export async function getListings({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return api(`/admin/listings/?${params}`)
}

export async function approveListing(listingId) {
  return api(`/admin/listings/${listingId}/approve`, { method: 'POST' })
}

export async function rejectListing(listingId, reason) {
  return api(`/admin/listings/${listingId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function suspendListing(listingId, reason) {
  return api(`/admin/listings/${listingId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function hideReview(reviewId) {
  return api(`/admin/reviews/${reviewId}/hide`, { method: 'POST' })
}

export async function showReview(reviewId) {
  return api(`/admin/reviews/${reviewId}/show`, { method: 'POST' })
}

export async function getReviews({ search = '', hidden = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.set('search', search)
  if (hidden) params.set('hidden', hidden)
  return api(`/admin/reviews/?${params}`)
}

export async function getPayments({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return api(`/admin/payments/?${params}`)
}

export async function refundPayment(paymentId, amount, reason) {
  return api(`/admin/payments/${paymentId}/refund?amount=${amount}&reason=${encodeURIComponent(reason)}`, {
    method: 'POST',
  })
}


export async function getWithdrawals({ status = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  return api(`/admin/withdrawals/?${params}`)
}

export async function getWithdrawalCount(status = '') {
  const params = {}
  if (status) params.status = status
  const qs = new URLSearchParams(params).toString()
  return api(`/admin/withdrawals/count${qs ? `?${qs}` : ''}`)
}


export async function approveWithdrawal(withdrawalId) {
  return api(`/admin/withdrawals/${withdrawalId}/approve`, { method: 'POST' })
}

export async function rejectWithdrawal(withdrawalId, reason = '') {
  return api(`/admin/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getBookings({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return api(`/admin/bookings/?${params}`)
}

export async function getDisputes({ status = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  return api(`/admin/disputes/?${params}`)
}

export async function updateDispute(disputeId, data) {
  return api(`/admin/disputes/${disputeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getSupportTickets({ status = '', priority = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (priority) params.set('priority', priority)
  if (search) params.set('search', search)
  return api(`/admin/support/?${params}`)
}

export async function updateTicket(ticketId, data) {
  return api(`/admin/support/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
