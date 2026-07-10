const HOST_API_URL = import.meta.env.VITE_HOST_API_URL || 'http://localhost:5001'

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const res = await fetch(`${HOST_API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || data.detail || `Host API error: ${res.status}`)
  }

  return res.json()
}

function unwrap(result) {
  if (result && result.data) {
    return result.data
  }
  return result
}

export async function getHosts({ search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.set('search', search)
  const result = await api(`/api/admin/hosts?${params}`)
  const data = unwrap(result)
  if (data && data.users) {
    return data.users.map(u => ({ ...u, role: 'Host' }))
  }
  return []
}

export async function getHost(hostId) {
  const result = await api(`/api/admin/hosts/${hostId}`)
  return unwrap(result)
}

export async function deleteHost(hostId) {
  return api(`/api/admin/hosts/${hostId}`, { method: 'DELETE' })
}

export async function getProperties({ status = '', search = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const result = await api(`/api/admin/properties?${params}`)
  const data = unwrap(result)
  if (data && data.properties) {
    return data.properties.map(p => ({
      ...p,
      cover_photo: p.cover_photo && !p.cover_photo.startsWith('http')
        ? `${HOST_API_URL}${p.cover_photo}`
        : p.cover_photo,
    }))
  }
  return []
}

export async function updatePropertyStatus(propertyId, status) {
  const result = await api(`/api/admin/properties/${propertyId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
  return unwrap(result)
}

export async function getVerifications({ status = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) {
    const hostStatus = status === 'approved' ? 'active' : status === 'rejected' ? 'inactive' : status
    params.set('status', hostStatus)
  }
  const result = await api(`/api/admin/verifications?${params}`)
  const data = unwrap(result)
  if (data && data.verifications) {
    return data.verifications.map(v => ({
      ...v,
      type: 'host',
      status: v.status === 'active' ? 'approved' : v.status === 'inactive' ? 'rejected' : v.status,
      id_card_url: v.id_card_url && !v.id_card_url.startsWith('http')
        ? `${HOST_API_URL}${v.id_card_url}`
        : v.id_card_url || '',
      selfie_url: v.selfie_url && !v.selfie_url.startsWith('http')
        ? `${HOST_API_URL}${v.selfie_url}`
        : v.selfie_url || '',
    }))
  }
  return []
}

export async function approveVerification(verificationId) {
  return api(`/api/admin/verifications/${verificationId}/approve`, { method: 'POST' })
}

export async function rejectVerification(verificationId, reason = '') {
  return api(`/api/admin/verifications/${verificationId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getStats() {
  const result = await api('/api/admin/stats')
  return unwrap(result) || {}
}
