import fs from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Params = { id?: string }

export default async function OrderPage({
  params,
}: {
  params: Params | Promise<Params>
}) {
  const p = await Promise.resolve(params)
  const id = p?.id

  if (!id || typeof id !== 'string') return notFound()

  const baseDir =
    process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

  const filePath = path.join(baseDir, `${id}.json`)

  try {
    const file = await fs.readFile(filePath, 'utf8')
    const order = JSON.parse(file)

    const items = Array.isArray(order?.items) ? order.items : []
    const subtotal =
      typeof order?.subtotal_mxn === 'number'
        ? order.subtotal_mxn
        : typeof order?.subtotal === 'number'
          ? order.subtotal
          : null

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Order {order?.id || id}</h1>
        <p className="mb-6">Status: {order?.status || '(unknown)'}</p>

        <div className="space-y-2 mb-6">
          {items.length ? (
            items.map((item: any, idx: number) => (
              <div key={item?.slug || item?.name_en || idx}>
                {(item?.name_en || item?.slug || 'item')} × {item?.quantity ?? 0}
              </div>
            ))
          ) : (
            <div>(no items)</div>
          )}
        </div>

        <div className="font-semibold">
          Subtotal: {subtotal !== null ? `$${subtotal} MXN` : '(not set)'}
        </div>

        <p className="mt-6 text-sm text-gray-600">
          Thank you. We’ll email payment instructions shortly.
        </p>
      </main>
    )
  } catch {
    return notFound()
  }
}
