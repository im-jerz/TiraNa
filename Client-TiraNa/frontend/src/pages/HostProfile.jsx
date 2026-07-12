import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchHostProfile } from '../api/listings'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function BadgeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [map, positions])
  return null
}

function HostSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="flex flex-col items-center md:items-start md:w-80 shrink-0">
            <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-4" />
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex-1 space-y-8">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function useGeocode(locations) {
  const [coords, setCoords] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!locations.length) {
      setLoading(false)
      return
    }

    const unique = [...new Set(locations)]
    let cancelled = false
    const cache = {}

    async function geocode(location) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Philippines')}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        if (data.length > 0) {
          cache[location] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        }
      } catch {}
    }

    async function run() {
      for (const loc of unique) {
        await geocode(loc)
      }
      if (!cancelled) {
        setCoords({ ...cache })
        setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [locations.join(',')])

  return { coords, loading }
}

export default function HostProfile() {
  const { id } = useParams()
  const [host, setHost] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchHostProfile(id)
      .then((data) => {
        setHost(data.host)
        setProperties(data.properties)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const locations = useMemo(
    () => properties.map((p) => p.location).filter(Boolean),
    [properties]
  )
  const { coords, loading: geoLoading } = useGeocode(locations)

  const markerPositions = useMemo(() => {
    return properties
      .filter((p) => coords[p.location])
      .map((p) => ({
        position: coords[p.location],
        property: p,
      }))
  }, [properties, coords])

  const mapCenter = useMemo(() => {
    if (markerPositions.length > 0) return markerPositions[0].position
    return [12.8797, 121.774]
  }, [markerPositions])

  if (loading) return <HostSkeleton />

  if (error || !host) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-500 text-sm">Host not found.</p>
            <Link to="/" className="text-teal text-sm font-medium hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-charcoal mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Link>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="flex flex-col items-center md:items-start md:w-80 shrink-0">
            <img
              src={host.avatar || 'https://via.placeholder.com/96'}
              alt={host.name}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <h1 className="text-xl font-semibold text-charcoal">{host.name}</h1>
            {host.isSuperhost && (
              <span className="flex items-center gap-1 text-teal font-medium text-sm mt-1">
                <BadgeIcon className="w-4 h-4" />
                Superhost
              </span>
            )}
            <p className="text-sm text-gray-400 mt-1">
              Joined in {host.joined}
            </p>
            {host.listingsCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {host.listingsCount} {host.listingsCount === 1 ? 'listing' : 'listings'}
              </p>
            )}
          </div>

          <div className="flex-1">
            {host.bio && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-charcoal mb-3">About {host.name}</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{host.bio}</p>
              </div>
            )}

            {properties.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-charcoal mb-4">
                  {host.name}'s locations
                </h2>
                {geoLoading ? (
                  <div className="h-72 w-full bg-gray-100 rounded-xl animate-pulse" />
                ) : (
                  <div className="h-72 w-full rounded-xl overflow-hidden border border-gray-200">
                    <MapContainer
                      center={mapCenter}
                      zoom={12}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                      style={{ background: '#e5e7eb' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds positions={markerPositions.map((m) => m.position)} />
                      {markerPositions.map((m) => (
                        <Marker key={m.property.id} position={m.position}>
                          <Popup>
                            <Link to={`/properties/${m.property.id}`} className="block min-w-[180px]">
                              <img
                                src={m.property.image || 'https://via.placeholder.com/200x120'}
                                alt={m.property.name}
                                className="w-full h-24 object-cover rounded mb-1"
                              />
                              <p className="font-medium text-sm text-charcoal">{m.property.name}</p>
                              <p className="text-xs text-gray-500">{m.property.location}</p>
                              <p className="text-xs font-semibold text-charcoal mt-0.5">
                                ₱{m.property.price?.toLocaleString()} <span className="font-normal text-gray-400">night</span>
                              </p>
                            </Link>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                )}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-charcoal mb-4">
                {host.name}'s listings
              </h2>

              {properties.length === 0 ? (
                <p className="text-gray-400 text-sm">No active listings yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Link
                      key={property.id}
                      to={`/properties/${property.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                        <img
                          src={property.image || 'https://via.placeholder.com/400x300'}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-charcoal text-sm truncate group-hover:underline">
                            {property.name}
                          </h3>
                          {property.rating > 0 && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              ★ {property.rating.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {property.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {property.type || 'Entire place'} · {property.guests} guests
                        </p>
                        <p className="text-sm font-semibold text-charcoal">
                          ₱{property.price?.toLocaleString()} <span className="font-normal text-gray-400 text-xs">night</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
