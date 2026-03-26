import path from 'path'
import fs from 'fs/promises'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const ORDER_DATA_DIR =
  process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

type OrderSummary = {
  id: string
  createdAt?: string
  status?: string
  subtotal_mxn?: number
  customer?: {
    email?: string
    name?: string
  }
}

function money(n?: number) {
  const safe = Number.isFinite(n) ? Number(n) : 0
  return `$${safe.toLocaleString('en-US')} MXN`
}

async function readOrders(): Promise<OrderSummary[]> {
  try {
    const names = await fs.readdir(ORDER_DATA_DIR)
    const jsonFiles = names.filter((n) => n.endsWith('.json'))

    const orders = await Promise.all(
      jsonFiles.map(async (name) => {
        try {
          const raw = await fs.readFile(path.join(ORDER_DATA_DIR, name), 'utf8')
          return JSON.parse(raw) as OrderSummary
        } catch {
          return null
        }
      })
    )

    return orders
      .filter(Boolean)
      .sort((a, b) => {
        const ta = Date.parse(a?.createdAt || '') || 0
        const tb = Date.parse(b?.createdAt || '') || 0
        return tb - ta
      }) as OrderSummary[]
  } catch {
    return []
  }
}

export default async function AdminOrdersPage() {
  const orders = await readOrders()

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Admin Orders</h1>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-white/70">No orders found.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="text-sm">
                <p><strong>{order.id}</strong></p>
                <p>Status: {order.status || '(none)'}</p>
                <p>Created: {order.createdAt || '(none)'}</p>
                <p>Email: {order.customer?.email || '(none)'}</p>
                <p>Total: {money(order.subtotal_mxn)}</p>
              </div>

              <Link href={`/admin/orders/${order.id}`} className="underline">
                Open admin view
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  )
}