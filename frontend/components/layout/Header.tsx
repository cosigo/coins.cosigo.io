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
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-semibold text-xl tracking-wide text-[var(--accent-silver)] hover:text-white transition"
          >
            COSIGO Store
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            <a
              href="https://cosigo.io"
              className="text-[var(--text-muted)] hover:text-white transition"
            >
              Main Site
            </a>

            <a
              href="https://authentic.cosigo.io"
              className="text-[var(--text-muted)] hover:text-white transition"
            >
              Authenticity
            </a>
          </nav>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--accent-steel)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition shadow-sm"
          aria-label="Open cart"
        >
          <span>Cart</span>
          <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-black/20 px-2 py-[2px] text-xs">
            {count}
          </span>
        </Link>
      </div>
    </header>
  )
}