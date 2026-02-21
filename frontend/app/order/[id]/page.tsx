import fs from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const baseDir =
    process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

  const filePath = path.join(baseDir, `${id}.json`)

  try {
    const file = await fs.readFile(filePath, 'utf8')
    const order = JSON.parse(file)

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Order {order.id}</h1>
        <p className="mb-6">Status: {order.status}</p>

        <div className="space-y-2 mb-6">
          {order.items.map((item: any) => (
            <div key={item.slug}>
              {item.name_en} × {item.quantity}
            </div>
          ))}
        </div>

        <div className="font-semibold">
          Subtotal: ${order.subtotal_mxn || order.subtotal} MXN
        </div>
      </main>
    )
  } catch {
    return notFound()
  }
}
