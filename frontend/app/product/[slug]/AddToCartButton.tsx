'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/products'
import { addToCart } from '@/lib/cart'
import { useLiveAvailability } from '@/lib/useLiveAvailability'
import AvailabilityBadge from '@/components/store/AvailabilityBadge'

export default function AddToCartButton({
  product,
}: {
  product: Product
}) {
  const { available } = useLiveAvailability(product.slug, product.stock)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof available === 'number' && available > 0 && quantity > available) {
      setQuantity(available)
    }
  }, [available, quantity])

  const liveAvailable =
    typeof available === 'number' ? available : Math.max(0, product.stock || 0)

  const outOfStock = liveAvailable <= 0

  function dec() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function inc() {
    setQuantity((q) => Math.min(liveAvailable || 1, q + 1))
  }

  function handleAdd() {
    if (outOfStock) return

    const safeQty = Math.max(1, Math.min(quantity, liveAvailable))

    addToCart(
      {
        ...product,
        stock: liveAvailable,
        inStock: liveAvailable > 0,
      },
      safeQty
    )

    setMessage(safeQty === 1 ? 'Added to cart' : `Added ${safeQty} to cart`)
    window.setTimeout(() => setMessage(''), 1800)
  }

  return (
    <div className="space-y-3">
      <AvailabilityBadge slug={product.slug} fallback={product.stock} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={outOfStock || quantity <= 1}
          className="px-3 py-2 rounded border border-[var(--border-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <span className="min-w-[2rem] text-center">{quantity}</span>

        <button
          type="button"
          onClick={inc}
          disabled={outOfStock || quantity >= liveAvailable}
          className="px-3 py-2 rounded border border-[var(--border-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="px-5 py-3 rounded-lg bg-[var(--accent-steel)] text-white font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {outOfStock ? 'Out of stock' : 'Add to cart'}
      </button>

      {message ? (
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      ) : null}
    </div>
  )
}
