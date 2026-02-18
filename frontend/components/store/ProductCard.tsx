'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/products'
import { useEffect, useMemo, useState } from 'react'

type Side = 'obverse' | 'reverse'

/**
 * ---- BTC/MXN shared fetch (one request for all ProductCard instances) ----
 * - localStorage cache: 60s (tweak as you like)
 * - in-memory promise cache: prevents multiple simultaneous fetches
 */
let btcMxnPromise: Promise<number> | null = null

async function fetchBtcMxnCached(): Promise<number> {
  // localStorage cache first
  try {
    const raw = localStorage.getItem('btc_mxn_cache_v1')
    if (raw) {
      const { v, t } = JSON.parse(raw) as { v: number; t: number }
      if (typeof v === 'number' && typeof t === 'number') {
        const ageMs = Date.now() - t
        if (ageMs < 60_000) return v // cache valid for 60s
      }
    }
  } catch {
    // ignore cache errors
  }

  if (!btcMxnPromise) {
    btcMxnPromise = (async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=mxn',
        { cache: 'no-store' }
      )
      if (!res.ok) throw new Error('Failed to fetch BTC/MXN')
      const data = await res.json()
      const rate = data?.bitcoin?.mxn
      if (typeof rate !== 'number') throw new Error('Bad BTC/MXN response')

      try {
        localStorage.setItem(
          'btc_mxn_cache_v1',
          JSON.stringify({ v: rate, t: Date.now() })
        )
      } catch {
        // ignore
      }
      return rate
    })().finally(() => {
      // allow refresh later (after cache expires) by clearing promise
      setTimeout(() => {
        btcMxnPromise = null
      }, 60_000)
    })
  }

  return btcMxnPromise
}

function mxnToBtc(mxn: number, btcMxn: number): number {
  return mxn / btcMxn
}

export default function ProductCard({ product }: { product: Product }) {
  const [side, setSide] = useState<Side>('obverse')
  const [zoomOpen, setZoomOpen] = useState(false)

  // ---- BTC state ----
  const [btcMxn, setBtcMxn] = useState<number | null>(null)
  const [btcErr, setBtcErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchBtcMxnCached()
      .then(rate => {
        if (!alive) return
        setBtcMxn(rate)
        setBtcErr(null)
      })
      .catch(err => {
        if (!alive) return
        setBtcErr(err?.message ?? 'BTC fetch failed')
        setBtcMxn(null)
      })
    return () => {
      alive = false
    }
  }, [])

  const priceBtc = useMemo(() => {
    if (!btcMxn) return null
    return mxnToBtc(product.price_mxn, btcMxn)
  }, [btcMxn, product.price_mxn])

  const src = side === 'obverse' ? product.images.obverse : product.images.reverse

  return (
    <>
      {/* CARD */}
      <div
        className="
          rounded-2xl
          bg-[var(--bg-panel)]
          border border-[var(--border-soft)]
          overflow-hidden
          transition
          hover:border-white/15
          hover:shadow-[0_0_20px_var(--glow)]
        "
      >
        {/* IMAGE AREA */}
        <div className="relative aspect-square bg-black/10">
          {/* IMAGE */}
          <Image
            src={src}
            alt={product.name_en}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14vw"
            className="object-contain p-4 transition-transform duration-300 hover:scale-[1.03]"
          />

          {/* CLICK TO FLIP */}
          <button
            type="button"
            onClick={() => setSide(s => (s === 'obverse' ? 'reverse' : 'obverse'))}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Flip coin image"
            title="Click to flip"
          />

          {/* ZOOM BUTTON */}
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="
              absolute top-2 right-2 z-20
              rounded-full
              bg-black/70 hover:bg-black/85
              text-white text-xs
              px-3 py-2
              border border-white/10
            "
            title="Zoom"
            aria-label="Zoom image"
          >
            🔍
          </button>
        </div>

        {/* TEXT AREA → NAVIGATION */}
        <Link href={`/product/${product.slug}`} className="block p-4 group">
          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition">
            {product.name_en}
          </h3>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {product.weight_g} g · {product.metal}
          </p>

          <p className="mt-3 text-sm font-semibold">
            ${product.price_mxn.toLocaleString()} MXN
          </p>

          {/* ✅ BTC line */}
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {priceBtc ? `${priceBtc.toFixed(8)} BTC` : btcErr ? 'BTC unavailable' : '… BTC'}
          </p>

          <p className="mt-2 text-xs text-[var(--accent-steel)] opacity-80 group-hover:opacity-100 transition">
            Shop
          </p>
        </Link>
      </div>

      {/* ZOOM MODAL */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4"
          onMouseDown={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="
              relative w-full max-w-[92vw]
              rounded-2xl bg-[var(--bg-panel)]
              border border-[var(--border-soft)]
              overflow-hidden
              flex flex-col
            "
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[var(--border-soft)]">
              <div className="text-sm text-[var(--text-muted)]">
                {product.name_en}
              </div>
              <button
                onClick={() => setZoomOpen(false)}
                className="rounded-lg px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
              >
                Close
              </button>
            </div>

            {/* BIG IMAGE */}
            <div className="relative w-full h-[80vh] bg-black/10">
              <Image
                src={src}
                alt={product.name_en}
                fill
                sizes="100vw"
                className="object-contain p-6"
              />
            </div>

            {/* CONTROLS */}
            <div className="p-3 flex gap-2 justify-center">
              <button
                onClick={() => setSide('obverse')}
                className="px-3 py-1 rounded-lg border border-[var(--border-soft)] text-sm text-[var(--text-muted)] hover:text-white"
              >
                Obverse
              </button>
              <button
                onClick={() => setSide('reverse')}
                className="px-3 py-1 rounded-lg border border-[var(--border-soft)] text-sm text-[var(--text-muted)] hover:text-white"
              >
                Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
