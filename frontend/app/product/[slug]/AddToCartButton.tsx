'use client'

import { Product } from '@/lib/products'
import { addToCart } from '@/lib/cart'

export default function AddToCartButton({ product }: { product: Product }) {
  return (
    <button
      onClick={() => {
        addToCart(product, 1)
        alert('Added to cart')
      }}
      className="px-6 py-3 bg-black text-white rounded-md"
    >
      Add to cart
    </button>
  )
}
