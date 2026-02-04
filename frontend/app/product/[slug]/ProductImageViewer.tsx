'use client'

import Image from 'next/image'
import { useState } from 'react'

type Side = 'obverse' | 'reverse'

export default function ProductImageViewer({
  name,
  obverse,
  reverse,
}: {
  name: string
  obverse: string
  reverse: string
}) {
  const [side, setSide] = useState<Side>('obverse')

  const src = side === 'obverse' ? obverse : reverse
  const alt = name

  return (
    <div className="space-y-3">
      {/* Image panel */}
      <div className="rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-soft)] overflow-hidden">
        <div className="relative aspect-square bg-black/10 max-w-[420px] mx-auto">

          {/* IMAGE */}
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 90vw, 420px"
            className="object-contain p-4"
            priority
          />

          {/* CLICK-TO-FLIP LAYER */}
          <button
            type="button"
            onClick={() =>
              setSide(s => (s === 'obverse' ? 'reverse' : 'obverse'))
            }
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Flip coin image"
            title="Click to flip"
          />
        </div>
      </div>
    </div>
  )
}
