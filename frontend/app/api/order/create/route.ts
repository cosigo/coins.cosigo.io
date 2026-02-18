import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import type { CartItem } from '@/lib/cart'

type CreateOrderBody = {
  items: CartItem[]
  customer?: {
    email?: string
    name?: string
  }
  shipping?: {
    name?: string
    line1?: string
    city?: string
    region?: string
    postal?: string
    country?: string
  }
  notes?: string
}

function money(n: number) {
  return `$${n.toLocaleString('en-US')} MXN`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const subtotal_mxn = body.items.reduce(
      (sum, i) => sum + i.price_mxn * i.quantity,
      0
    )

    const orderId = `csg_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${crypto.randomBytes(4).toString('hex')}`

    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      currency: 'MXN',
      subtotal_mxn,
      items: body.items,
      customer: body.customer || {},
      shipping: body.shipping || {},
      status: 'awaiting_crypto',
      accepted: ['BTC', 'LTC', 'ETH'],
    }

    const baseDir = process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')
    await fs.mkdir(baseDir, { recursive: true })
    const filePath = path.join(baseDir, `${orderId}.json`)
    await fs.writeFile(filePath, JSON.stringify(order, null, 2), 'utf8')

    // --- email notify (store owner) ---
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM
    const notifyTo = process.env.ORDER_NOTIFY_EMAIL

    if (host && user && pass && from && notifyTo) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      const lines = body.items
        .map(i => `- ${i.name_en} x${i.quantity} (${i.weight_g} g, ${i.metal}) = ${money(i.price_mxn * i.quantity)}`)
        .join('\n')

      await transporter.sendMail({
        from,
        to: notifyTo,
        subject: `New Cosigo Coin Order: ${orderId}`,
        text:
          `Order: ${orderId}\n` +
          `Subtotal: ${money(subtotal_mxn)}\n\n` +
          `Items:\n${lines}\n\n` +
          `Customer email: ${body.customer?.email || '(none)'}\n` +
          `Shipping name: ${body.shipping?.name || '(none)'}\n` +
          `Status: awaiting_crypto\n`,
      })
    }

    // Return invoice URL
    return NextResponse.json({
      ok: true,
      orderId,
      redirect: `/order/${orderId}`,
    })
  } catch (err: any) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
