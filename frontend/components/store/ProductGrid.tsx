import ProductCard from './ProductCard'
import { Product } from '@/lib/products'

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div
      className="
        grid
        gap-5
        [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]
      "
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
