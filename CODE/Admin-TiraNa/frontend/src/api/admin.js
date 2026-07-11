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

export async function deleteUser(userId) {
  return api(`/admin/users/${userId}`, { method: 'DELETE' })
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
