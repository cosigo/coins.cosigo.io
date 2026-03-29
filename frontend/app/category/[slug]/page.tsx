import { getCategoryMeta } from '@/lib/categories'
import { products, ProductCategory } from '@/lib/products'
import { notFound } from 'next/navigation'
import ProductGrid from '@/components/store/ProductGrid'

export const metadata = {
  title: 'Category'
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = slug as ProductCategory

  const meta = getCategoryMeta(category)

  const categoryProducts = products.filter(
    p => p.category === category
  )

  if (categoryProducts.length === 0) {
    notFound()
  }

  return (
    <main className="max-w-[1600px] mx-auto px-10 py-10">

      {/* Category Hero Panel */}
      <div className="mb-10 p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-soft)]">
        <h1 className="text-3xl font-semibold tracking-wide">
          {meta?.label ?? slug.replace(/-/g, ' ')}
        </h1>

        {meta?.description && (
          <p className="text-[var(--text-muted)] mb-6">
            {meta.description}
          </p>
        )}
      </div>

      {/* Products */}
      <div className="mt-6">

        <ProductGrid products={categoryProducts} />
      </div>

    </main>
  )
}
