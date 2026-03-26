'use client'

import { useEffect, useState } from 'react'

export function useLiveAvailability(slug: string, fallback?: number) {
    const [available, setAvailable] = useState<number | null>(
        typeof fallback === 'number' && Number.isFinite(fallback)
            ? Math.max(0, Math.floor(fallback))
            : null
    )
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true

        async function load() {
            try {
                setLoading(true)
                const res = await fetch(
                    `/api/availability?slug=${encodeURIComponent(slug)}`,
                    { cache: 'no-store' }
                )

                if (!res.ok) return

                const data = await res.json()
                if (active && typeof data.available === 'number') {
                    setAvailable(Math.max(0, Math.floor(data.available)))
                }
            } catch {
                // keep fallback
            } finally {
                if (active) setLoading(false)
            }
        }

        if (slug) load()

        return () => {
            active = false
        }
    }, [slug])

    return { available, loading }
}