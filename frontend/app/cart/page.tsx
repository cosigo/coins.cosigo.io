'use client'

import { useEffect, useState } from 'react'
import {
  CartItem,
  getCart,
  updateQuantity,
  removeFromCart,
} from '@/lib/cart'
import Link from 'next/link'
import Image from 'next/image'
import CryptoEstimate from '@/components/store/CryptoEstimate'

export const metadata = {
  title: 'Cart'
}

type AvailabilityMap = Record<string, number>

async function fetchAvailabilityMap(items: CartItem[]): Promise<AvailabilityMap> {
  const slugs = [...new Set(items.map((item) => item.slug))]
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/availability?slug=${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        })
        if (!res.ok) return [slug, -1] as const
        const data = await res.json()
        return [slug, typeof data.available === 'number' ? data.available : -1] as const
      } catch {
        return [slug, -1] as const
      }
    })
  )

  return Object.fromEntries(entries)
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [availability, setAvailability] = useState<AvailabilityMap>({})
  const [notice, setNotice] = useState('')

  async function refreshLiveCart() {
    const cart = getCart()
    const live = await fetchAvailabilityMap(cart)
    setAvailability(live)

    let changed = false
    const notes: string[] = []

    for (const item of cart) {
      const availableNow = live[item.slug]

      if (typeof availableNow !== 'number' || availableNow < 0) continue

      if (availableNow === 0) {
        removeFromCart(item.id)
        changed = true
        notes.push(`${item.name_en} was removed because it is out of stock.`)
        continue
      }

      if (item.quantity > availableNow) {
        updateQuantity(item.id, availableNow)
        changed = true
        notes.push(`${item.name_en} was adjusted to ${availableNow}.`)
      }
    }

    const finalCart = getCart()
    setItems(finalCart)
    setNotice(notes.join(' '))
  }

  useEffect(() => {
    refreshLiveCart()

    function onCartUpdated() {
      refreshLiveCart()
    }

    window.addEventListener('cart-updated', onCartUpdated)
    return () => {
      window.removeEventListener('cart-updated', onCartUpdated)
    }
  }, [])

  const subtotal = items.reduce(
    (sum, item) => sum + item.price_mxn * item.quantity,
    0
  )

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-4">Your cart</h1>
        <p className="text-[var(--text-muted)] mb-6">Your cart is empty.</p>
        <Link href="/" className="underline">
          Continue shopping
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">Your cart</h1>

      {notice ? (
        <div className="mb-6 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {notice}
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => {
          const availableNow = availability[item.slug]
          const liveAvailable =
            typeof availableNow === 'number' && availableNow >= 0
              ? availableNow
              : item.stock

          return (
            <div
              key={item.id}
              className="
                flex items-center justify-between
                p-4 rounded-xl
                bg-[var(--bg-panel)]
                border border-[var(--border-soft)]
              "
            >
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-[var(--border-soft)]">
                  {item.images?.obverse ? (
                    <Image
                      src={item.images.obverse}
                      alt={item.name_en}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                      No image
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium">{item.name_en}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.weight_g} g · {item.metal}
                  </p>

                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {liveAvailable === 0
                      ? 'Out of stock'
                      : liveAvailable === 1
                      ? 'Only 1 available'
                      : `Available now: ${liveAvailable}`}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        updateQuantity(item.id, item.quantity - 1)
                      }}
                      className="px-2 py-1 rounded border border-[var(--border-soft)] text-sm hover:border-white/20"
                    >
                      −
                    </button>

                    <span className="text-sm">{item.quantity}</span>

                    <button
                      onClick={() => {
                        updateQuantity(item.id, item.quantity + 1)
                      }}
                      disabled={item.quantity >= liveAvailable}
                      className="px-2 py-1 rounded border border-[var(--border-soft)] text-sm hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>

                    <button
                      onClick={() => {
                        removeFromCart(item.id)
                      }}
                      className="text-xs text-red-400 ml-4 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="font-semibold">
                ${(item.price_mxn * item.quantity).toLocaleString()} MXN
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-lg font-semibold">
          Subtotal: ${subtotal.toLocaleString()} MXN
        </div>

        <CryptoEstimate subtotalMxn={subtotal} />

        <div className="flex gap-4">
          <Link href="/" className="underline">
            Continue shopping
          </Link>

          <Link href="/checkout">
            <button
              className="
                px-6 py-3 rounded-lg
                bg-[var(--accent-steel)]
                text-white font-medium
                hover:opacity-90
                transition
              "
            >
              Checkout
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}