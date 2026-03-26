import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const ORDER_DATA_DIR =
  process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

const VALID_ID = /^[A-Za-z0-9_-]+$/
const ALLOWED_STATUSES = new Set([
  'awaiting_crypto',
  'paid',
  'fulfilled',
  'expired',
  'cancelled',
  'returned',
])

type Body = {
  orderId?: string
  status?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const orderId = (body.orderId || '').trim()
    const status = (body.status || '').trim()

    if (!VALID_ID.test(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const file = path.join(ORDER_DATA_DIR, `${orderId}.json`)
    const raw = await fs.readFile(file, 'utf8')
    const order = JSON.parse(raw)

    const now = new Date().toISOString()
    const previousStatus = order.status || null

    order.status = status
    order.updatedAt = now
    order.statusUpdatedAt = now

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = []
    }

    order.statusHistory.push({
      from: previousStatus,
      to: status,
      at: now,
    })

    await fs.writeFile(file, JSON.stringify(order, null, 2), 'utf8')

    return NextResponse.json({
      ok: true,
      orderId,
      previousStatus,
      status,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}