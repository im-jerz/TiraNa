import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchListingDetail, fetchListings } from '../api/listings.js'

function StarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function HalfStarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <defs>
        <linearGradient id="halfGrad">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfGrad)" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function BedIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7V5a1 1 0 011-1h16a1 1 0 011 1v2M3 7h18M3 11h18M3 15h18M8 7V5M16 7V5" />
    </svg>
  )
}

function BathIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v-2a3 3 0 013-3h10a3 3 0 013 3v2M4 16h16M4 16l-1 3m17-3l1 3M8 7l2 4M16 7l-2 4" />
    </svg>
  )
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function BadgeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function HeartIcon({ className, filled }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function ShareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

function ShareModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-charcoal">Share</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-charcoal transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">{copied ? 'Copied!' : 'Copy Link'}</p>
              <p className="text-xs text-gray-400">Copy the property link to clipboard</p>
            </div>
          </button>

          {navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal">Share via...</p>
                <p className="text-xs text-gray-400">Use your device's share menu</p>
              </div>
            </button>
          )}


        </div>
      </div>
    </div>
  )
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  )
}

function MinusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

const ratingLabels = {
  cleanliness: 'Cleanliness',
  accuracy: 'Accuracy',
  communication: 'Communication',
  location: 'Location',
  checkIn: 'Check-in',
  value: 'Value',
}

const amenityIcons = {
  'Wifi': 'M12 18h.01M8 21h8M5 16h14M3 12h18M7 8h10M9 4h6',
  'Kitchen': 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  'Washer': 'M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 3h8M6 18h12M6 14h12M6 10h12',
  'Air conditioning': 'M12 2v4M12 18v4M4 12H2m6.34-6.34L6.93 4.93m10.73 1.41l1.41-1.41M4 12h16M4.93 17.07l1.41 1.41M17.66 6.34l1.41 1.41',
  'Heating': 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  'TV': 'M8 3h8l-4 4-4-4zM4 7h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z',
  'Hair dryer': 'M17 11a5 5 0 01-5 5m0 0a5 5 0 01-5-5m5 5v4m-3 0h6M4.93 4.93a8 8 0 0114.14 0',
  'Iron': 'M5 12h14M7 8h10M9 4h6M12 16v6M7 22h10',
  'Essentials': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  'Hangers': 'M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7H5a2 2 0 00-2 2v8a2 2 0 002 2h2m10-10h2a2 2 0 012 2v8a2 2 0 01-2 2h-2',
  'Shampoo': 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  'Pool': 'M2 20h20M4 16h16M6 12h12M8 8h8M10 4h4M2 20l4-4m0 0l4-4m-4 4l-4-4m16 4l-4-4m4 4l4-4',
  'Free parking': 'M8 7h8m-8 0a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2',
  'Garden': 'M3 21l3-3m0 0l3-3m-3 3l-3-3m3 3l3 3m3-6l3-3m0 0l3-3m-3 3l-3-3m3 3l3 3M12 3v6m0 0l3-3m-3 3l-3-3',
  'Workspace': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  'Elevator': 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm3 5l4-4 4 4m-4 12l-4-4m4 0l4 4',
  'Doorman': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  'Gym': 'M4 21V9m0 0V5a2 2 0 012-2h5a2 2 0 012 2v4m-9 0h9m0 0v12m2-12h4a2 2 0 012 2v4a2 2 0 01-2 2h-4m0-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4m4 0h4',
  'Fireplace': 'M4 16l4.5-4.5M4 16l-2 4m2-4l4 4m-4-4l2-2M20 16l-4.5-4.5M20 16l2 4m-2-4l-4 4m4-4l-2-2M12 2v4m0 14v4M8 12h8',
  'Smoke alarm': 'M12 9v2m0 4h.01M3.87 5h16.26A1 1 0 0121 6.1l-1.5 10.2a1 1 0 01-1 .9H5.5a1 1 0 01-1-.9L3 6.1A1 1 0 013.87 5z',
  'Kayak': 'M14 5l-2-2-2 2m2-2v8m-8 4h16M6 17l-4 4m18-4l4-4M2 21l4-4m14 4l-4-4M11 7h2M9 11h6',
  'Parking': 'M8 7h8m-8 0a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2',
}

function RatingStars({ rating }) {
  const stars = []
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5

  for (let i = 0; i < full; i++) {
    stars.push(<StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-500" />)
  }
  if (hasHalf) {
    stars.push(<HalfStarIcon key="half" className="w-4 h-4 text-yellow-500" />)
  }
  while (stars.length < 5) {
    stars.push(<StarIcon key={`empty-${stars.length}`} className="w-4 h-4 text-gray-300" />)
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>
}

function RatingBreakdownBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

const ratingCategories = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'checkIn', label: 'Check-in' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'communication', label: 'Communication' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value' },
]

function CategoryRatingRow({ label, value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-colors bg-transparent border-none cursor-pointer"
          >
            <StarIcon
              className={`w-5 h-5 ${(hover || value) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function PhotoGallery({ images }) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-lg overflow-hidden max-h-[70vh]">
      <div className="md:col-span-2 md:row-span-2 relative overflow-hidden bg-charcoal cursor-pointer group" onClick={() => setSelected(0)}>
        <img
          src={images[0]}
          alt="Main view"
          className={`w-full h-full object-cover transition-opacity duration-500 ${selected === 0 ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
        />
        <img
          src={images[selected]}
          alt="Selected view"
          className="w-full h-full object-cover"
        />
        {selected !== 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(0) }}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-white transition-colors rounded"
          >
            Show all photos
          </button>
        )}
      </div>
      {images.slice(1, 5).map((img, i) => (
        <button
          key={i}
          onClick={() => setSelected(i + 1)}
          className={`relative overflow-hidden bg-charcoal hidden md:block ${selected === i + 1 ? 'ring-2 ring-sage' : ''}`}
        >
          <img
            src={img}
            alt={`View ${i + 2}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </button>
      ))}
    </div>
  )
}

function GuestPicker({ guests, setGuests, onClose, maxGuests }) {
  function update(type, delta) {
    setGuests(prev => {
      const next = { ...prev }
      next[type] = Math.max(0, prev[type] + delta)
      if (type === 'adults' && next.adults < 1) next.adults = 1
      const total = next.adults + next.children
      if (total > maxGuests) return prev
      return next
    })
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl z-30 p-5 rounded">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Adults</p>
            <p className="text-xs text-gray-400">Ages 13+</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update('adults', -1)}
              disabled={guests.adults <= 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{guests.adults}</span>
            <button
              type="button"
              onClick={() => update('adults', 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Children</p>
            <p className="text-xs text-gray-400">Ages 2-12</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update('children', -1)}
              disabled={guests.children <= 0}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{guests.children}</span>
            <button
              type="button"
              onClick={() => update('children', 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Infants</p>
            <p className="text-xs text-gray-400">Under 2</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update('infants', -1)}
              disabled={guests.infants <= 0}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{guests.infants}</span>
            <button
              type="button"
              onClick={() => update('infants', 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-charcoal transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full py-2 text-sm font-medium text-sage hover:text-olive transition-colors"
      >
        Close
      </button>
    </div>
  )
}

function BookingCard({ room, checkIn, setCheckIn, checkOut, setCheckOut, checkInTime, setCheckInTime, checkOutTime, setCheckOutTime, guests, setGuests, onBookNow }) {
  const [showGuestPicker, setShowGuestPicker] = useState(false)

  const totalGuests = guests.adults + guests.children

  function getNights() {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    return diff
  }

  const nights = getNights()
  const subtotal = room.price * nights
  const total = subtotal + room.cleaningFee + room.serviceFee

  return (
    <div className="bg-white border border-gray-200 shadow-lg p-6 rounded">
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-bold text-charcoal">₱{room.price}</span>
        <span className="text-sm text-gray-500">/ night</span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-px bg-gray-200 rounded overflow-hidden">
          <div className="bg-white p-3">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Check-in</label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-sm text-gray-700 focus:outline-none bg-transparent [color-scheme:light]"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full text-sm text-gray-700 focus:outline-none bg-transparent mt-1.5 pt-1.5 border-t border-gray-100"
            />
          </div>
          <div className="bg-white p-3">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Check-out</label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm text-gray-700 focus:outline-none bg-transparent [color-scheme:light]"
                min={checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full text-sm text-gray-700 focus:outline-none bg-transparent mt-1.5 pt-1.5 border-t border-gray-100"
            />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowGuestPicker(!showGuestPicker)}
            className="w-full border border-gray-300 px-3 py-3 flex items-center justify-between bg-white hover:border-charcoal transition-colors text-sm"
          >
            <div className="text-left">
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider block mb-0.5">Guests</span>
              <span className="text-gray-600">{totalGuests} guest{totalGuests !== 1 ? 's' : ''}{guests.infants > 0 ? `, ${guests.infants} infant${guests.infants > 1 ? 's' : ''}` : ''} · max {room.highlights.guests}</span>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${showGuestPicker ? 'rotate-180' : ''}`} />
          </button>
          {showGuestPicker && (
            <GuestPicker guests={guests} setGuests={setGuests} onClose={() => setShowGuestPicker(false)} maxGuests={room.highlights.guests} />
          )}
        </div>
      </div>

      {nights > 0 && (
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>₱{room.price} x {nights} night{nights > 1 ? 's' : ''}</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Cleaning fee</span>
            <span>₱{room.cleaningFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Service fee</span>
            <span>₱{room.serviceFee.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <span className="text-base font-bold text-charcoal">Total</span>
        <span className="text-base font-bold text-charcoal">
          {nights > 0 ? `₱${total.toLocaleString()}` : '—'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onBookNow({ checkIn: `${checkIn}T${checkInTime}:00`, checkOut: `${checkOut}T${checkOutTime}:00`, guests, nights, total })}
        disabled={!checkIn || !checkOut}
        className="w-full py-3.5 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Book Now
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">You won't be charged yet</p>
    </div>
  )
}

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

const BOOKING_API = 'http://localhost:5000/api/bookings'

function AvailabilityCalendar({ propertyId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    fetch(`${BOOKING_API}/property/${propertyId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setBookings(data.data || [])
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [propertyId])

  function prevMonth() {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
  }

  function isBooked(day) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setDate(dateEnd.getDate() + 1)

    return bookings.some(b => {
      const checkIn = new Date(b.check_in)
      const checkOut = new Date(b.check_out)
      return date < checkOut && dateEnd > checkIn
    })
  }

  function getBookedRanges() {
    return bookings.map(b => ({
      checkIn: new Date(b.check_in),
      checkOut: new Date(b.check_out),
    }))
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleString('en-PH', { month: 'long', year: 'numeric' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookedRanges = getBookedRanges()

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-5">Availability</h2>
      {loading ? (
        <div className="bg-gray-50 rounded p-6 animate-pulse">
          <div className="h-5 bg-gray-200 w-40 mb-4" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      ) : fetchError ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded p-5 text-center">
          <p className="text-sm text-yellow-700 mb-2">Unable to load availability data.</p>
          <p className="text-xs text-yellow-600">Please make sure the backend server is running.</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-gray-500 hover:text-charcoal transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-charcoal">{monthName}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-gray-500 hover:text-charcoal transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(year, month, day)
              date.setHours(0, 0, 0, 0)
              const booked = isBooked(day)
              const isPast = date < today
              const isToday = date.getTime() === today.getTime()

              return (
                <div
                  key={day}
                  className={`relative text-xs py-2 rounded text-center ${
                    isToday
                      ? 'font-bold text-teal ring-1 ring-teal'
                      : isPast
                      ? 'text-gray-300'
                      : booked
                      ? 'bg-red-100 text-red-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 bg-white'
                  }`}
                >
                  {day}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-gray-300" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-teal bg-white" />
              Today
            </span>
          </div>

          {bookedRanges.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-charcoal mb-2">Upcoming bookings:</p>
              <div className="space-y-1.5">
                {bookedRanges.map((r, i) => (
                  <p key={i} className="text-xs text-gray-500">
                    {r.checkIn.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })} &rarr; {r.checkOut.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            !fetchError && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-green-600 font-medium">All dates are currently available. Book now!</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [similarRooms, setSimilarRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [eligibleBooking, setEligibleBooking] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRatings, setReviewRatings] = useState({
    accuracy: 0,
    checkIn: 0,
    cleanliness: 0,
    communication: 0,
    location: 0,
    value: 0,
  })
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [editReview, setEditReview] = useState(null)
  const [editRatings, setEditRatings] = useState({
    accuracy: 0,
    checkIn: 0,
    cleanliness: 0,
    communication: 0,
    location: 0,
    value: 0,
  })
  const [editText, setEditText] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0 })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchListingDetail(id)
      .then((data) => {
        setRoom(data)
        return fetchListings()
      })
      .then((allListings) => {
        setSimilarRooms(allListings.filter(r => r.id !== Number(id)).slice(0, 3))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    fetch(`http://localhost:5000/api/reviews/property/${id}`)
      .then(res => res.json())
      .then(data => setUserReviews(data.data || []))
      .catch(() => {})

    const token = localStorage.getItem('token')
    if (token) {
      const stored = localStorage.getItem('user')
      if (stored) {
        try { setCurrentUserId(JSON.parse(stored).id) } catch {}
      }
      fetch(`http://localhost:5000/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          const list = data.data || []
          const now = new Date()
          const completed = list.find(b => {
            if (String(b.property_id) !== String(id)) return false
            if (b.status !== 'confirmed') return false
            return new Date(b.check_out) < now
          })
          if (completed) {
            setEligibleBooking(completed)
            fetch(`http://localhost:5000/api/reviews/check/${completed.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => res.json())
              .then(data => setReviewSubmitted(data.exists))
              .catch(() => {})
          }
        })
        .catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (!room) return
    document.title = `${room.title} - TiraNa`
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[property="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('og:title', room.title)
    setMeta('og:description', room.description?.slice(0, 200) || `Book ${room.title} on TiraNa`)
    setMeta('og:image', room.images?.[0] || '')
    setMeta('og:url', window.location.href)
    setMeta('og:type', 'website')
    setMeta('og:site_name', 'TiraNa')
    return () => {
      document.title = 'TiraNa'
      ;['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name'].forEach(p => {
        const el = document.querySelector(`meta[property="${p}"]`)
        if (el) el.remove()
      })
    }
  }, [room])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 text-sm font-medium text-charcoal hover:text-sage transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link to="/" className="text-lg font-bold tracking-widest uppercase text-teal">TiraNa</Link>
            <div className="w-20" />
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-lg overflow-hidden max-h-[70vh] animate-pulse">
            <div className="md:col-span-2 md:row-span-2 bg-gray-200 min-h-[300px]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 min-h-[150px] hidden md:block" />
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
            <div className="space-y-5 animate-pulse">
              <div className="h-8 bg-gray-200 w-3/4" />
              <div className="h-4 bg-gray-200 w-1/2" />
              <div className="h-4 bg-gray-200 w-1/3" />
              <div className="h-32 bg-gray-200 w-full" />
              <div className="h-4 bg-gray-200 w-full" />
              <div className="h-4 bg-gray-200 w-5/6" />
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <HomeIcon className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-3">Property Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const amenityKeys = Object.keys(amenityIcons)
  const roomAmenities = room.amenities.map(a => ({
    name: a,
    path: amenityIcons[a] || 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  }))

  const displayAmenities = showAllAmenities ? roomAmenities : roomAmenities.slice(0, 8)

  function getReviewAvg(r) {
    const cats = ['accuracy', 'checkIn', 'cleanliness', 'communication', 'location', 'value']
    const vals = cats.map(k => Number(r[k])).filter(v => v > 0)
    return vals.length > 0
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : Number(r.rating)
  }

  const reviewMap = new Map()
  ;(room.reviews || []).forEach(r => { if (r.id) reviewMap.set(r.id, r) })
  userReviews.forEach(r => { if (r.id) reviewMap.set(r.id, r) })
  const allReviews = [...reviewMap.values()]
  const allReviewRatings = allReviews.map(r => getReviewAvg(r)).filter(r => r > 0)
  const computedRating = allReviewRatings.length > 0
    ? Math.round((allReviewRatings.reduce((a, b) => a + b, 0) / allReviewRatings.length) * 10) / 10
    : room.rating
  const computedReviewsCount = allReviewRatings.length || room.reviewsCount

  const categoryAverages = {}
  ;['accuracy', 'checkIn', 'cleanliness', 'communication', 'location', 'value'].forEach(key => {
    const ratings = userReviews
      .filter(r => r[key] != null && Number(r[key]) > 0)
      .map(r => Number(r[key]))
    categoryAverages[key] = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : computedRating
  })

  async function handleEditReview() {
    const hasRating = Object.values(editRatings).some(v => Number(v) > 0)
    if (!hasRating || !editReview) return
    setEditLoading(true)
    setEditError('')
    try {
      const token = localStorage.getItem('token')
      const catValues = Object.values(editRatings).map(Number).filter(v => v > 0)
      const overallRating = Math.round((catValues.reduce((a, b) => a + b, 0) / catValues.length) * 10) / 10
      const res = await fetch(`http://localhost:5000/api/reviews/${editReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: overallRating,
          accuracy: editRatings.accuracy || null,
          check_in: editRatings.checkIn || null,
          cleanliness: editRatings.cleanliness || null,
          communication: editRatings.communication || null,
          location: editRatings.location || null,
          value: editRatings.value || null,
          review_text: editText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditReview(null)
      setEditRatings({ accuracy: 0, checkIn: 0, cleanliness: 0, communication: 0, location: 0, value: 0 })
      setEditText('')
      fetch(`http://localhost:5000/api/reviews/property/${id}`)
        .then(res => res.json())
        .then(d => setUserReviews(d.data || []))
        .catch(() => {})
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeleteReview() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/reviews/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteTarget(null)
      setReviewSubmitted(false)
      fetch(`http://localhost:5000/api/reviews/property/${id}`)
        .then(res => res.json())
        .then(d => setUserReviews(d.data || []))
        .catch(() => {})
    } catch (err) {
      setReviewError(err.message)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  function openEditReview(review) {
    setEditReview(review)
    setEditRatings({
      accuracy: Number(review.accuracy) || 0,
      checkIn: Number(review.checkIn) || 0,
      cleanliness: Number(review.cleanliness) || 0,
      communication: Number(review.communication) || 0,
      location: Number(review.location) || 0,
      value: Number(review.value) || 0,
    })
    setEditText(review.text || '')
    setEditError('')
  }

  async function handleSubmitReview() {
    const hasRating = Object.values(reviewRatings).some(v => Number(v) > 0)
    if (!hasRating || !eligibleBooking) return
    setReviewLoading(true)
    setReviewError('')
    try {
      const token = localStorage.getItem('token')
      const catValues = Object.values(reviewRatings).map(Number).filter(v => v > 0)
      const overallRating = Math.round((catValues.reduce((a, b) => a + b, 0) / catValues.length) * 10) / 10
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: eligibleBooking.id,
          rating: overallRating,
          accuracy: reviewRatings.accuracy || null,
          check_in: reviewRatings.checkIn || null,
          cleanliness: reviewRatings.cleanliness || null,
          communication: reviewRatings.communication || null,
          location: reviewRatings.location || null,
          value: reviewRatings.value || null,
          review_text: reviewText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviewSubmitted(true)
      setShowReviewForm(false)
      setReviewRatings({ accuracy: 0, checkIn: 0, cleanliness: 0, communication: 0, location: 0, value: 0 })
      setReviewText('')
      fetch(`http://localhost:5000/api/reviews/property/${id}`)
        .then(res => res.json())
        .then(d => setUserReviews(d.data || []))
        .catch(() => {})
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-sm font-medium text-charcoal hover:text-sage transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link to="/" className="text-lg font-bold tracking-widest uppercase text-teal">
            TiraNa
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 text-sm text-charcoal hover:text-sage transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${saved ? 'text-red-500' : 'text-charcoal hover:text-red-400'}`}
            >
              <HeartIcon className="w-4 h-4" filled={saved} />
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
        <PhotoGallery images={room.images} />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal leading-tight">{room.title}</h1>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4 text-sage" />
                    {room.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-charcoal">{computedRating}</span>
                    <span className="text-gray-400">({computedReviewsCount} reviews)</span>
                  </span>
                  {room.superhost && (
                    <span className="flex items-center gap-1 text-teal font-medium text-xs">
                      <BadgeIcon className="w-4 h-4" />
                      Superhost
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="my-5 border-gray-200" />

            <div className="flex items-center gap-4">
              <img
                src={room.host.avatar}
                alt={room.host.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-charcoal">Hosted by {room.host.name}</p>
                <p className="text-xs text-gray-400">Joined in {room.host.joined}</p>
              </div>
            </div>

            <hr className="my-5 border-gray-200" />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-700">
              <span className="flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-sage shrink-0" />
                {room.highlights.type}
              </span>
              <span className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-sage shrink-0" />
                {room.highlights.guests} guests
              </span>
              <span className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-sage shrink-0" />
                {room.highlights.bedrooms} bedroom{room.highlights.bedrooms > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-sage shrink-0" />
                {room.highlights.beds} bed{room.highlights.beds > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-2">
                <BathIcon className="w-5 h-5 text-sage shrink-0" />
                {room.highlights.baths} bath{room.highlights.baths > 1 ? 's' : ''}
              </span>
            </div>

            <hr className="my-5 border-gray-200" />

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {room.description}
            </p>

            <hr className="my-6 border-gray-200" />

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-5">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {displayAmenities.map((amenity) => (
                  <div key={amenity.name} className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-sage shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={amenity.path} />
                    </svg>
                    {amenity.name}
                  </div>
                ))}
              </div>
              {roomAmenities.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-sm font-medium text-teal hover:text-olive transition-colors flex items-center gap-1"
                >
                  {showAllAmenities ? 'Show fewer amenities' : `Show all ${roomAmenities.length} amenities`}
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAllAmenities ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <hr className="my-6 border-gray-200" />

            <AvailabilityCalendar propertyId={id} />

            <hr className="my-6 border-gray-200" />

            <div>
              <div className="flex items-center gap-2 mb-6">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-lg sm:text-xl font-bold text-charcoal">{computedRating}</span>
                <span className="text-lg text-gray-400">&middot;</span>
                <span className="text-lg text-gray-600">{computedReviewsCount} reviews</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                {ratingCategories.map(cat => (
                  <RatingBreakdownBar key={cat.key} label={cat.label} value={categoryAverages[cat.key]} />
                ))}
              </div>

              {eligibleBooking && !reviewSubmitted && !showReviewForm && (
                <div className="mb-8 p-5 bg-gray-50 border border-gray-200 text-center">
                  <p className="text-sm font-semibold text-charcoal mb-3">Have you stayed here?</p>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="px-6 py-2.5 bg-sage text-white text-sm font-medium uppercase tracking-wider hover:bg-olive transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              )}

              {eligibleBooking && reviewSubmitted && (
                <div className="mb-8 p-5 bg-teal/5 border border-teal/10 text-center">
                  <p className="text-sm font-medium text-teal">You have reviewed this property. Thank you!</p>
                </div>
              )}

              {showReviewForm && (
                <div className="mb-8 p-5 sm:p-6 bg-white border border-gray-200">
                  <h3 className="text-sm font-bold text-charcoal mb-4">Write Your Review</h3>
                  <div className="space-y-3 mb-4">
                    {ratingCategories.map((cat) => (
                      <CategoryRatingRow
                        key={cat.key}
                        label={cat.label}
                        value={reviewRatings[cat.key]}
                        onChange={(val) => setReviewRatings(prev => ({ ...prev, [cat.key]: val }))}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Overall:</span>
                    {(() => {
                      const vals = Object.values(reviewRatings).map(Number).filter(v => v > 0)
                      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
                      return (
                        <>
                          <RatingStars rating={avg} />
                          <span className="text-xs text-gray-400 ml-1">{avg > 0 ? avg.toFixed(1) : ''}</span>
                        </>
                      )
                    })()}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience (optional)"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all resize-none mb-4"
                  />
                  {reviewError && (
                    <div className="mb-4 bg-red-50 border border-red-100 px-4 py-3">
                      <p className="text-xs text-red-600">{reviewError}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowReviewForm(false); setReviewError(''); setReviewRatings({ accuracy: 0, checkIn: 0, cleanliness: 0, communication: 0, location: 0, value: 0 }); setReviewText('') }}
                      disabled={reviewLoading}
                      className="px-4 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={reviewLoading || Object.values(reviewRatings).every(v => Number(v) === 0)}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-sage hover:bg-olive transition-colors disabled:opacity-40"
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {room.reviews.map((review) => (
                  <div key={review.id} className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <RatingStars rating={getReviewAvg(review)} />
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.text}</p>
                  </div>
                ))}
                {userReviews.map((review) => {
                  const isOwner = currentUserId && review.user_id === currentUserId
                  return (
                    <div key={review.id} className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0 group relative">
                      {isOwner && (
                        <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditReview(review)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-sage hover:bg-sage/5 rounded transition-colors bg-transparent border-none cursor-pointer"
                            title="Edit review"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(review)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors bg-transparent border-none cursor-pointer"
                            title="Delete review"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-xs font-bold text-sage shrink-0">
                          {review.name ? review.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal">{review.name}</p>
                          <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <RatingStars rating={getReviewAvg(review)} />
                      {review.text && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.text}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <BookingCard room={room} checkIn={checkIn} setCheckIn={setCheckIn} checkOut={checkOut} setCheckOut={setCheckOut} checkInTime={checkInTime} setCheckInTime={setCheckInTime} checkOutTime={checkOutTime} setCheckOutTime={setCheckOutTime} guests={guests} setGuests={setGuests} onBookNow={(data) => {
                navigate(`/bookings/${room.id}/new`, {
                  state: {
                    property_id: room.id,
                    title: room.title,
                    image: room.images[0],
                    location: room.location,
                    rating: room.rating,
                    price: room.price,
                    cleaningFee: room.cleaningFee,
                    serviceFee: room.serviceFee,
                    ...data,
                  },
                })
              }} />

              <div className="mt-6 hidden lg:block">
                <div className="border border-gray-200 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                      <BadgeIcon className="w-5 h-5 text-sage" />
                    </div>
                    <p className="text-xs text-gray-600">
                       <span className="font-semibold text-charcoal">Secure booking</span> with TiraNa's guarantee.
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Free cancellation available for this property. Check policies at time of booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-8">Similar properties you might like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {similarRooms.map((r) => (
              <Link
                key={r.id}
                to={`/properties/${r.id}`}
                className="group bg-white shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                    ₱{r.price} <span className="font-normal text-gray-500">/ night</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{r.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0 ml-2">
                      <RatingStars rating={r.rating} />
                      <span>{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">{r.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-teal">₱{r.price}<span className="text-xs font-normal text-gray-400">/night</span></span>
                    <span className="text-xs font-medium text-olive group-hover:underline">View Details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-charcoal text-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">TiraNa</h3>
              <p className="text-xs sm:text-sm leading-relaxed">Ang iyong pinagkakatiwalaang platform para sa mga accommodation sa buong Pilipinas.</p>
            </div>
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">About</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Contact</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><Link to="/contact" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Legal</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} TiraNa. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>

      {editReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => { setEditReview(null); setEditError('') }}>
          <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-charcoal mb-1">Edit Review</h3>
            <p className="text-sm text-gray-500 mb-5 truncate">{room.title}</p>
            <div className="mb-5 space-y-3">
              {ratingCategories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{cat.label}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRatings(prev => ({ ...prev, [cat.key]: star }))}
                        className="p-0.5 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <svg
                          className={`w-5 h-5 ${editRatings[cat.key] >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Overall:</span>
                {(() => {
                  const vals = Object.values(editRatings).map(Number).filter(v => v > 0)
                  const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
                  return (
                    <>
                      <RatingStars rating={avg} />
                      <span className="text-xs text-gray-400 ml-1">{avg > 0 ? avg.toFixed(1) : ''}</span>
                    </>
                  )
                })()}
              </div>
            </div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all resize-none mb-4"
            />
            {editError && (
              <div className="mb-4 bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs text-red-600">{editError}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setEditReview(null); setEditError('') }}
                disabled={editLoading}
                className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditReview}
                disabled={editLoading || Object.values(editRatings).every(v => Number(v) === 0)}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-sage hover:bg-olive transition-colors disabled:opacity-40"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-charcoal mb-2">Delete Review</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
              >
                Keep Review
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          url={window.location.href}
          title={`Check out ${room.title} on TiraNa`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-4 lg:hidden">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-charcoal">₱{room.price}</span>
              <span className="text-xs text-gray-500">/ night</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <StarIcon className="w-3 h-3 text-yellow-500" />
              <span>{computedRating}</span>
              <span className="text-gray-300">&middot;</span>
              <span>{computedReviewsCount} reviews</span>
            </div>
          </div>
          <button
            type="button"
            disabled={!checkIn || !checkOut}
            onClick={() => {
              const checkInDatetime = `${checkIn}T${checkInTime}:00`
              const checkOutDatetime = `${checkOut}T${checkOutTime}:00`
              const start = new Date(checkInDatetime)
              const end = new Date(checkOutDatetime)
              const nights = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
              const subtotal = room.price * nights
              const total = subtotal + room.cleaningFee + room.serviceFee
              navigate(`/bookings/${room.id}/new`, {
                state: {
                  property_id: room.id,
                  title: room.title,
                  image: room.images[0],
                  location: room.location,
                  rating: room.rating,
                  price: room.price,
                  cleaningFee: room.cleaningFee,
                  serviceFee: room.serviceFee,
                  checkIn: checkInDatetime,
                  checkOut: checkOutDatetime,
                  guests,
                  nights,
                  total,
                },
              })
            }}
            className="px-8 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetails
