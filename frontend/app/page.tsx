// app/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getCategories } from '@/lib/categories'

export const metadata = {
  title: 'Home page'
}

export default function HomePage() {
  const categories = getCategories()

  return (
    <main className="max-w-7xl mx-auto px-8 py-12">

  {/* Top Icon */}
  <div className="flex justify-center mb-6">
    <Image
      src="/cosigo_master_128.png"
      alt="COSIGO"
      width={100}
      height={100}
      className="opacity-90 hover:opacity-100 transition"
      priority
    />
  </div>

  <h1 className="text-2xl font-semibold tracking-wide mb-10 text-center">
    Only BTC, LTC, ETH are accepted payment forms at this time. Credit cards, OXXO and Mercado Pago will be implemented soon.
  </h1>

  <h1 className="text-2xl font-semibold tracking-wide mb-10 text-center">
    Categories.
  </h1>

      {/* GRID */}
      <div
        className="
          grid
          gap-8
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-4
        "
      >
        {categories.map(cat => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group h-full"
          >
            {/* CARD */}
            <div
              className="
                rounded-2xl
                bg-[var(--bg-panel)]
                border border-[var(--border-soft)]
                overflow-hidden
                transition-all
                hover:border-white/20
                hover:shadow-[0_0_25px_var(--glow)]
                flex flex-col
                h-full
              "
            >
              {/* IMAGE PANEL (fixed height) */}
              <div className="relative h-44 bg-black/40 border-b border-[var(--border-soft)] overflow-hidden shrink-0">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                )}

                {/* vignette overlay */}
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* TEXT PANEL */}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-lg font-semibold">
                  {cat.label}
                </h2>

                {cat.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                {/* FOOTER pinned to bottom */}
                <div className="mt-auto pt-5 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">
                    {cat.count} items
                  </span>

                  <span className="text-xs text-[var(--accent-steel)] group-hover:translate-x-1 transition-transform">
                    View category →
                  </span>

                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
