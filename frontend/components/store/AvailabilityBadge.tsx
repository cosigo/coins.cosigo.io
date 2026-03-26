'use client'

import { useLiveAvailability } from '@/lib/useLiveAvailability'

export default function AvailabilityBadge({
  slug,
  fallback,
}: {
  slug: string
  fallback?: number
}) {
  const { available, loading } = useLiveAvailability(slug, fallback)

  let text = 'Checking availability...'
  let className = 'text-xs text-[var(--text-muted)]'

  if (!loading || available !== null) {
    if (available === 0) {
      text = 'Out of stock'
      className = 'text-xs text-red-400'
    } else if (available === 1) {
      text = 'Only 1 available'
      className = 'text-xs text-amber-300'
    } else if (typeof available === 'number') {
      text = `Available: ${available}`
      className = 'text-xs text-[var(--text-muted)]'
    } else {
      text = 'Availability unavailable'
    }
  }

  return <p className={className}>{text}</p>
}
