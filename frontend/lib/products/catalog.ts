// lib/products/catalog.ts
import * as Morgan from './morgan-dollars'

type Product = {
  slug: string
  name_en?: string
  name_es?: string
  metal?: string
  weight_g?: number
  price_mxn?: number
  inStock?: boolean
  [k: string]: any
}

function asArray(mod: any): Product[] {
  // supports either: export default [...] OR export const something = [...]
  if (Array.isArray(mod?.default)) return mod.default
  for (const k of Object.keys(mod || {})) {
    const v = (mod as any)[k]
    if (Array.isArray(v)) return v
  }
  return []
}

export const products: Product[] = [
  ...asArray(Morgan),
]

export function findProductBySlug(slug: string): Product | null {
  return products.find(p => p?.slug === slug) || null
}
