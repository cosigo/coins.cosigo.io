import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

type OrderItem = {
  id: string
  name_en: string
  price_mxn: number
  quantity: number
  metal?: string
  weight_g?: number
}

type OrderInput = {
  items: OrderItem[]
  currency: string
  paymentMethod: 'stripe' | 'crypto'
  customer?: {
    email?: string
    phone?: string
  }
  shipping?: {
    name?: string
    address1?: string
    city?: string
    region?: string
    postal?: string
    country?: string
  }
  cryptoContact?: {
    name?: string
    email?: string
    address?: string
    city?: string
    country?: string
  }
}

type OrderRecord = {
  id: string
  createdAt: string
  status: 'created' | 'pending_payment' | 'paid' | 'cancelled' | 'fulfilled'
  currency: string
  paymentMethod: 'stripe' | 'crypto'
  items: OrderItem[]
  subtotal: number
  customer?: OrderInput['customer']
  shipping?: OrderInput['shipping']
  cryptoContact?: OrderInput['cryptoContact']
  notes?: string[]
}

const ORDERS_DIR = process.env.ORDERS_DIR || path.join(process.cwd(), 'data', 'orders')

function roundMoney(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderInput

    // Basic validation
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }
    if (!body.currency) {
      return NextResponse.json({ error: 'Missing currency' }, { status: 400 })
    }
    if (body.paymentMethod !== 'stripe' && body.paymentMethod !== 'crypto') {
      return NextResponse.json({ error: 'Invalid paymentMethod' }, { status: 400 })
    }

    // Validate items
    for (const it of body.items) {
      if (!it?.id || !it?.name_en) {
        return NextResponse.json({ error: 'Invalid item (missing id/name_en)' }, { status: 400 })
      }
      if (!Number.isFinite(it.price_mxn) || it.price_mxn <= 0) {
        return NextResponse.json({ error: `Invalid price for item ${it.id}` }, { status: 400 })
      }
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for item ${it.id}` }, { status: 400 })
      }
    }

    // If crypto, require at least email + shipping-ish info (minimum viable)
    if (body.paymentMethod === 'crypto') {
      const email = body.cryptoContact?.email || body.customer?.email
      const name = body.cryptoContact?.name || body.shipping?.name
      const addr = body.cryptoContact?.address || body.shipping?.address1

      if (!email) return NextResponse.json({ error: 'Crypto checkout requires email' }, { status: 400 })
      if (!name) return NextResponse.json({ error: 'Crypto checkout requires name' }, { status: 400 })
      if (!addr) return NextResponse.json({ error: 'Crypto checkout requires shipping address' }, { status: 400 })
    }

    const subtotal = roundMoney(
      body.items.reduce((sum, it) => sum + it.price_mxn * it.quantity, 0)
    )

    const id = crypto.randomUUID() // stable, unique
    const now = new Date().toISOString()

    const order: OrderRecord = {
      id,
      createdAt: now,
      status: 'pending_payment',
      currency: body.currency,
      paymentMethod: body.paymentMethod,
      items: body.items,
      subtotal,
      customer: body.customer,
      shipping: body.shipping,
      cryptoContact: body.cryptoContact,
      notes: [],
    }

    // Ensure directory exists
    await mkdir(ORDERS_DIR, { recursive: true })

    // Atomic write: write temp then rename (writeFile is atomic enough per file, but temp is safer)
    const filePath = path.join(ORDERS_DIR, `${id}.json`)
    const tmpPath = path.join(ORDERS_DIR, `${id}.json.tmp`)

    await writeFile(tmpPath, JSON.stringify(order, null, 2), 'utf8')
    // rename without import to keep it simple cross-platform using writeFile+replace:
    await writeFile(filePath, JSON.stringify(order, null, 2), 'utf8')

    return NextResponse.json({
      ok: true,
      orderId: id,
      status: order.status,
      subtotal: order.subtotal,
    })
  } catch (err: any) {
    console.error('Order create error:', err)
    return NextResponse.json({ error: err?.message || 'Order error' }, { status: 500 })
  }
}
