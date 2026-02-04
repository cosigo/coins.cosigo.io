import type { ProductCategory, Product } from "./types"

export function validateProducts(products: Product[]) {
  const categories = new Set<ProductCategory>()
  const errors: string[] = []

  for (const p of products) {
    if (!p.category) {
      errors.push(`Product ${p.id} has no category`)
      continue
    }
    categories.add(p.category)
  }

  return {
    categories: [...categories],
    errors,
  }
}
