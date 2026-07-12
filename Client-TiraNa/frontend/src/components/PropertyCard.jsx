import { Link } from 'react-router-dom'
import { RatingStars } from './StarRating.jsx'

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="relative h-48 sm:h-56 bg-gray-100" />
      <div className="p-4 sm:p-5">
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="h-5 bg-gray-100 rounded w-20" />
          <div className="h-8 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </div>
  )
}

export default function PropertyCard({ property, linkPrefix = '/properties/', overlay }) {
  const title = property.name || property.title || ''
  const image = property.image || (property.images && property.images[0]) || ''
  const price = property.price || 0
  const rating = property.rating || 0
  const location = property.location || ''
  const id = property.id || property.property_id

  return (
    <Link
      to={`${linkPrefix}${id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-sm font-bold text-charcoal">₱{price.toLocaleString()}</span>
          <span className="text-xs text-gray-400 ml-0.5">/night</span>
        </div>
        {overlay && (
          <div className="absolute top-3 left-3 z-10">
            {overlay}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors leading-snug line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <RatingStars rating={rating} />
            <span className="text-xs font-medium text-charcoal">{rating > 0 ? rating : '—'}</span>
          </div>
        </div>
        {location && (
          <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {location}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-base font-bold text-charcoal">₱{price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 ml-0.5">/night</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage group-hover:text-olive transition-colors duration-200">
            View
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
