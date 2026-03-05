'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCart } from '@/lib/cart'

export default function Header() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function updateCartCount() {
      const cart = getCart()
      const total = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCount(total)
    }

    updateCartCount()

    window.addEventListener('cart-updated', updateCartCount)

    return () => {
      window.removeEventListener('cart-updated', updateCartCount)
    }
  }, [])

  return (
    <header className="bg-[#0b0d12] border-b border-[var(--border-soft)] sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* LEFT SIDE — NETWORK NAV */}
        <div className="flex items-center gap-8">

          {/* Store (current site) */}
          <Link
            href="/"
            className="font-semibold text-xl tracking-wide text-[var(--accent-silver)] hover:text-white transition"
          >
            Cosigo Store
          </Link>

          <nav className="flex items-center gap-5 text-sm">

            {/* Main Site */}
            <a
              href="https://cosigo.io"
              className="text-[var(--text-muted)] hover:text-white transition"
            >
              Main Site
            </a>

            {/* Authenticity Portal */}
            <a
              href="https://authentic.cosigo.io"
              className="text-[var(--text-muted)] hover:text-white transition"
            >
              Authenticity
            </a>

          </nav>

        </div>

        {/* RIGHT SIDE — CART */}
        <Link
          href="/cart"
          className="relative text-[var(--text-muted)] hover:text-white transition text-lg"
        >
          🛒

          {count > 0 && (
            <span className="
              absolute -top-2 -right-2
              bg-[var(--accent-steel)]
              text-white text-xs
              rounded-full px-2 py-[2px]
              shadow-md
            ">
              {count}
            </span>
          )}
        </Link>

      </div>

    </header>
  )
}