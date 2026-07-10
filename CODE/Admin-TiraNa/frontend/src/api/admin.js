const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'

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
