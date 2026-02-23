// lib/products/catalog.ts
import { products as mergedProducts } from './index'
import type { Product } from './types'

export const products: Product[] = mergedProducts

export function findProductBySlug(slug: string): Product | null {
  return products.find((p) => p?.slug === slug) || null
}
