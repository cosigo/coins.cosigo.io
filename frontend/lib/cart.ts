'use client'

import { Product } from './products'

export type CartItem = Product & {
  quantity: number
}

const CART_KEY = 'cosigo_cart'

function emitCartUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'))
  }
}

function clampQuantity(quantity: number, stock: number) {
  if (!Number.isFinite(quantity)) return 1
  return Math.max(1, Math.min(Math.floor(quantity), Math.max(0, stock)))
}

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

  const stock = Math.max(0, Number(product.stock || 0))
  if (stock <= 0) return

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, stock)
    existing.stock = stock
    existing.inStock = stock > 0
  } else {
    cart.push({
      ...product,
      quantity: clampQuantity(quantity, stock),
    })
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()
}

export function updateQuantity(productId: string, quantity: number) {
  const cart = getCart()
    .map(item => {
      if (item.id !== productId) return item

      const stock = Math.max(0, Number(item.stock || 0))
      if (stock <= 0) return { ...item, quantity: 0 }

      return {
        ...item,
        quantity: clampQuantity(quantity, stock),
      }
    })
    .filter(item => item.quantity > 0)

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter(item => item.id !== productId)

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  emitCartUpdate()
}

export function clearCart() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CART_KEY)
    emitCartUpdate()
  } catch {}
}
