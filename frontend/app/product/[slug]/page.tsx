import { products } from '@/lib/products'
import { notFound } from 'next/navigation'
import AddToCartButton from './AddToCartButton'
import ProductImageViewer from './ProductImageViewer'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = products.find(p => p.slug === slug)
  if (!product) return notFound()

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-10 items-start">

        {/* IMAGE */}
        <div className="w-full flex justify-center lg:justify-start">
          <div className="w-full max-w-[360px]">
            <ProductImageViewer
              name={product.name_en}
              obverse={product.images.obverse}
              reverse={product.images.reverse}
            />
          </div>
        </div>

        {/* INFO / CTA */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{product.name_en}</h1>

          <p className="text-[var(--text-muted)]">
            {product.weight_g} g · {product.metal}
          </p>

          <p className="text-2xl font-bold">
            ${product.price_mxn.toLocaleString()} MXN
          </p>

          <div className="pt-4">
            <AddToCartButton product={product} />
          </div>
        </div>

      </div>
    </main>
  )
}
