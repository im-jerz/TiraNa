export function StarIconSimple({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export function HalfStarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <defs>
        <linearGradient id="halfGradGlobal">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfGradGlobal)" />
    </svg>
  )
}

export function RatingStars({ rating, size }) {
  const s = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  const stars = []
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  for (let i = 0; i < full; i++) {
    stars.push(<StarIconSimple key={`full-${i}`} className={`${s} text-yellow-500`} />)
  }
  if (hasHalf) {
    stars.push(<HalfStarIcon key="half" className={`${s} text-yellow-500`} />)
  }
  while (stars.length < 5) {
    stars.push(<StarIconSimple key={`empty-${stars.length}`} className={`${s} text-gray-300`} />)
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>
}
