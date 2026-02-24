'use client'

import { Product } from './products'

export type CartItem = Product & {
  quantity: number
}

const CART_KEY = 'cosigo_cart'

/* ---------- helpers ---------- */

function emitCartUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'))
  }
}

/* ---------- core ---------- */

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function addToCart(product: Product, quantity = 1) {
  const cart = getCart()
  const existing = cart.find(i => i.id === product.id)

  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ ...product, quantity })
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()   // 🔔 notify UI
}

export function updateQuantity(productId: string, quantity: number) {
  const cart = getCart()
    .map(item =>
      item.id === productId ? { ...item, quantity } : item
    )
    .filter(item => item.quantity > 0)

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()   // 🔔 notify UI
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter(item => item.id !== productId)

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()   // 🔔 notify UI
}

export function clearCart() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CART_KEY)
    emitCartUpdate()
  } catch {}
}
