import { HOST_API_URL } from './config'

const REVIEWS_API = 'http://localhost:5000/api/reviews'

export async function fetchListings(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = `${HOST_API_URL}/api/listings${query ? `?${query}` : ''}`
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return enrichWithRatings(json.data.properties)
}

export async function fetchFeaturedListings() {
  const res = await fetch(`${HOST_API_URL}/api/listings/featured`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return enrichWithRatings(json.data.properties)
}

export async function fetchStats() {
  const res = await fetch(`${HOST_API_URL}/api/listings/stats`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

export async function fetchLocations() {
  const res = await fetch(`${HOST_API_URL}/api/listings/locations`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data.locations
}

export async function fetchListingDetail(id) {
  const res = await fetch(`${HOST_API_URL}/api/listings/${id}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data.property
}

export async function fetchHostProfile(hostId) {
  const res = await fetch(`${HOST_API_URL}/api/listings/hosts/${hostId}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

async function fetchPropertyRatings(propertyIds) {
  if (propertyIds.length === 0) return {}
  try {
    const res = await fetch(`${REVIEWS_API}/ratings?property_ids=${propertyIds.join(',')}`)
    const json = await res.json()
    return json.data || {}
  } catch {
    return {}
  }
}

async function enrichWithRatings(properties) {
  if (!properties || properties.length === 0) return properties
  const ids = properties.map(p => p.id)
  const ratings = await fetchPropertyRatings(ids)
  return properties.map(p => ({
    ...p,
    rating: ratings[p.id] != null ? ratings[p.id] : (p.rating || 0),
  }))
}
