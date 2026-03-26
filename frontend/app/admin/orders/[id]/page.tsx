import path from 'path'
import fs from 'fs/promises'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import StatusButtons from './StatusButtons'

export const dynamic = 'force-dynamic'

const ORDER_DATA_DIR =
    process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

const VALID_ID = /^[A-Za-z0-9_-]+$/

type OrderItem = {
    slug?: string
    name_en?: string
    quantity?: number
    line_total_mxn?: number
    metal?: string
    weight_g?: number
}

type OrderRecord = {
    id: string
    createdAt?: string
    updatedAt?: string
    buildStamp?: string
    status?: string
    subtotal?: number
    subtotal_mxn?: number
    shipping_mxn?: number
    shipping_rate_type?: 'domestic' | 'international'
    total_mxn?: number
    items?: OrderItem[]
    customer?: {
        email?: string
        name?: string
        phone?: string
    }
    shipping?: {
        name?: string
        line1?: string
        city?: string
        region?: string
        postal?: string
        country?: string
    }
    statusHistory?: Array<{
        from?: string | null
        to?: string
        at?: string
    }>
}

function money(n?: number) {
    const safe = Number.isFinite(n) ? Number(n) : 0
    return `$${safe.toLocaleString('en-US')} MXN`
}

async function readOrder(id: string): Promise<OrderRecord | null> {
    try {
        if (!VALID_ID.test(id)) return null
        const file = path.join(ORDER_DATA_DIR, `${id}.json`)
        const raw = await fs.readFile(file, 'utf8')
        return JSON.parse(raw) as OrderRecord
    } catch {
        return null
    }
}

export default async function AdminOrderPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const order = await readOrder(id)

    if (!order) notFound()

    const items = Array.isArray(order.items) ? order.items : []
    const customer = order.customer || {}
    const shipping = order.shipping || {}
    const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Admin Order</h1>
                    <p className="text-sm text-white/60">{order.id}</p>
                </div>

                <Link href={`/order/${order.id}`} className="underline">
                    View public order page
                </Link>
            </div>

            <div className="mb-6">
                <StatusButtons
                    orderId={order.id}
                    currentStatus={order.status || 'awaiting_crypto'}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-semibold">Order</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>ID:</strong> {order.id}</p>
                        <p><strong>Status:</strong> {order.status || '(none)'}</p>
                        <p><strong>Created:</strong> {order.createdAt || '(none)'}</p>
                        <p><strong>Updated:</strong> {order.updatedAt || '(none)'}</p>
                        <p><strong>Build:</strong> {order.buildStamp || '(none)'}</p>
                        <p><strong>Subtotal:</strong> {(order.subtotal_mxn || order.subtotal || 0).toLocaleString()} MXN</p>
                        <p>
                            <strong>
                                Shipping {order.shipping_rate_type === 'domestic' ? '(Mexico)' : '(International)'}:
                            </strong>{' '}
                            {(order.shipping_mxn || 0).toLocaleString()} MXN
                        </p>
                        <p>
                            <strong>Total:</strong>{' '}
                            {(
                                order.total_mxn ||
                                ((order.subtotal_mxn || order.subtotal || 0) + (order.shipping_mxn || 0))
                            ).toLocaleString()} MXN
                        </p>
                    </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-semibold">Customer</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>Email:</strong> {customer.email || '(none)'}</p>
                        <p><strong>Name:</strong> {customer.name || '(none)'}</p>
                        <p><strong>Phone:</strong> {customer.phone || '(none)'}</p>
                    </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <h2 className="mb-3 text-lg font-semibold">Items</h2>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={`${item.slug || 'item'}-${idx}`} className="rounded-lg border border-white/10 p-3 text-sm">
                                <p><strong>{item.name_en || item.slug || 'Item'}</strong></p>
                                <p>Qty: {item.quantity || 0}</p>
                                <p>Metal: {item.metal || '(none)'}</p>
                                <p>Weight: {item.weight_g || 0} g</p>
                                <p>Line total: {money(item.line_total_mxn)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-semibold">Shipping</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {shipping.name || '(none)'}</p>
                        <p><strong>Address:</strong> {shipping.line1 || '(none)'}</p>
                        <p><strong>City:</strong> {shipping.city || '(none)'}</p>
                        <p><strong>Region:</strong> {shipping.region || '(none)'}</p>
                        <p><strong>Postal:</strong> {shipping.postal || '(none)'}</p>
                        <p><strong>Country:</strong> {shipping.country || '(none)'}</p>
                    </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-semibold">Status history</h2>
                    <div className="space-y-2 text-sm">
                        {statusHistory.length === 0 ? (
                            <p>No history yet.</p>
                        ) : (
                            statusHistory
                                .slice()
                                .reverse()
                                .map((entry, idx) => (
                                    <div key={idx} className="rounded-md border border-white/10 p-2">
                                        <p><strong>From:</strong> {entry.from || '(none)'}</p>
                                        <p><strong>To:</strong> {entry.to || '(none)'}</p>
                                        <p><strong>At:</strong> {entry.at || '(none)'}</p>
                                    </div>
                                ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}