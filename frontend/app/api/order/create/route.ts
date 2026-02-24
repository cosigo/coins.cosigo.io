import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import type { CartItem } from '@/lib/cart'
import { findProductBySlug } from '@/lib/products/catalog'

type CreateOrderBody = {
  items: CartItem[]
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
  notes?: string
}

type InvoiceItem = {
  slug: string
  name_en: string
  name_es?: string
  metal: string
  weight_g: number
  price_mxn: number
  quantity: number
  line_total_mxn: number
}

type CryptoQuote = {
  provider: 'coingecko'
  fetchedAt: string
  bufferBps: number
  rates_mxn_per: { BTC: number; ETH: number; LTC: number }
  addresses: { BTC: string; ETH: string; LTC: string }
  due: { BTC: number; ETH: number; LTC: number }
  uris: { BTC: string | null; ETH: string | null; LTC: string | null }
}

function money(n: number) {
  const safe = Number.isFinite(n) ? n : 0
  return `$${safe.toLocaleString('en-US')} MXN`
}

function ceilToDecimals(n: number, decimals: number) {
  if (!Number.isFinite(n)) return 0
  const f = Math.pow(10, decimals)
  return Math.ceil(n * f) / f
}

async function fetchMxnRatesCoingecko() {
  const url =
    'https://api.coingecko.com/api/v3/simple/price' +
    '?ids=bitcoin,ethereum,litecoin&vs_currencies=mxn'

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`CoinGecko rates failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as any
  const mxnPerBtc = Number(data?.bitcoin?.mxn)
  const mxnPerEth = Number(data?.ethereum?.mxn)
  const mxnPerLtc = Number(data?.litecoin?.mxn)

  if (![mxnPerBtc, mxnPerEth, mxnPerLtc].every(Number.isFinite)) {
    throw new Error('CoinGecko returned invalid MXN rates')
  }

  return { mxnPerBtc, mxnPerEth, mxnPerLtc, fetchedAt: new Date().toISOString() }
}

function buildOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = crypto.randomBytes(4).toString('hex')
  return `csg_${day}_${rand}`
}

function buildStamp() {
  return `buildstamp_${new Date().toISOString()}_${crypto
    .randomBytes(2)
    .toString('hex')}`
}

function buildInvoiceItems(bodyItems: CartItem[]): InvoiceItem[] {
  return bodyItems.map((i: any) => {
    if (!i?.slug || typeof i.slug !== 'string') {
      throw new Error('Invalid item slug')
    }

    const qty = Number(i.quantity || 0)
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Invalid quantity for ${i.slug}`)
    }

    const p = findProductBySlug(i.slug)
    if (!p) {
      throw new Error(`Unknown product slug: ${i.slug}`)
    }

    const price_mxn = (p as any).price_mxn
    const weight_g = (p as any).weight_g
    const name_en = (p as any).name_en
    const metal = (p as any).metal

    if (typeof price_mxn !== 'number') throw new Error(`Product missing price_mxn: ${p.slug}`)
    if (typeof weight_g !== 'number') throw new Error(`Product missing weight_g: ${p.slug}`)
    if (typeof name_en !== 'string') throw new Error(`Product missing name_en: ${p.slug}`)
    if (typeof metal !== 'string') throw new Error(`Product missing metal: ${p.slug}`)

    return {
      slug: p.slug,
      name_en,
      name_es: (p as any).name_es as string | undefined,
      metal,
      weight_g,
      price_mxn,
      quantity: qty,
      line_total_mxn: price_mxn * qty,
    }
  })
}

async function buildCryptoQuote(subtotal_mxn: number): Promise<CryptoQuote | null> {
  const bufferBps = Number(process.env.CRYPTO_BUFFER_BPS || 100) // 1% default
  const bufferMult = 1 + bufferBps / 10_000

  // NOTE: these are public addresses; NEXT_PUBLIC is fine
  const addrBTC = process.env.NEXT_PUBLIC_BTC_ADDRESS || ''
  const addrETH = process.env.NEXT_PUBLIC_ETH_ADDRESS || ''
  const addrLTC = process.env.NEXT_PUBLIC_LTC_ADDRESS || ''

  try {
    const rates = await fetchMxnRatesCoingecko()

    const btc = ceilToDecimals((subtotal_mxn / rates.mxnPerBtc) * bufferMult, 8)
    const eth = ceilToDecimals((subtotal_mxn / rates.mxnPerEth) * bufferMult, 6)
    const ltc = ceilToDecimals((subtotal_mxn / rates.mxnPerLtc) * bufferMult, 6)

    return {
      provider: 'coingecko',
      fetchedAt: rates.fetchedAt,
      bufferBps,
      rates_mxn_per: { BTC: rates.mxnPerBtc, ETH: rates.mxnPerEth, LTC: rates.mxnPerLtc },
      addresses: { BTC: addrBTC, ETH: addrETH, LTC: addrLTC },
      due: { BTC: btc, ETH: eth, LTC: ltc },
      uris: {
        BTC: addrBTC ? `bitcoin:${addrBTC}?amount=${btc}` : null,
        ETH: addrETH ? `ethereum:${addrETH}?value=${eth}` : null,
        LTC: addrLTC ? `litecoin:${addrLTC}?amount=${ltc}` : null,
      },
    }
  } catch {
    return null
  }
}

function buildOwnerEmailText(args: {
  orderId: string
  buildStamp: string
  subtotal_mxn: number
  items: InvoiceItem[]
  customer?: CreateOrderBody['customer']
  shipping?: CreateOrderBody['shipping']
  cryptoQuote: CryptoQuote | null
}) {
  const { orderId, buildStamp, subtotal_mxn, items, customer, shipping, cryptoQuote } = args

  const lines = items
    .map(
      (it) =>
        `- ${it.name_en} x${it.quantity} (${it.weight_g} g, ${it.metal}) = ${money(
          it.line_total_mxn
        )}`
    )
    .join('\n')

  const cust = customer || {}
  const ship = shipping || {}

  const cryptoLines = cryptoQuote?.due
    ? `\n\nCrypto due (buffer ${cryptoQuote.bufferBps} bps):\n` +
      `BTC: ${cryptoQuote.due.BTC}\n` +
      `ETH: ${cryptoQuote.due.ETH}\n` +
      `LTC: ${cryptoQuote.due.LTC}\n`
    : ''

  return (
    `Order: ${orderId}\n` +
    `Build: ${buildStamp}\n` +
    `Subtotal: ${money(subtotal_mxn)}\n\n` +
    `Items:\n${lines}\n\n` +
    `Customer email: ${cust.email || '(none)'}\n` +
    `Customer name: ${cust.name || '(none)'}\n` +
    `Phone: ${cust.phone || '(none)'}\n\n` +
    `Shipping:\n` +
    `Name: ${ship.name || '(none)'}\n` +
    `Address: ${ship.line1 || '(none)'}\n` +
    `City: ${ship.city || '(none)'}\n` +
    `Region: ${ship.region || '(none)'}\n` +
    `Postal: ${ship.postal || '(none)'}\n` +
    `Country: ${ship.country || '(none)'}\n\n` +
    `Status: awaiting_crypto\n` +
    cryptoLines
  )
}

async function maybeSendOwnerEmail(args: {
  orderId: string
  buildStamp: string
  subtotal_mxn: number
  items: InvoiceItem[]
  customer?: CreateOrderBody['customer']
  shipping?: CreateOrderBody['shipping']
  cryptoQuote: CryptoQuote | null
}) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  const notifyTo = process.env.ORDER_NOTIFY_EMAIL

  if (!(host && user && pass && from && notifyTo)) return

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to: notifyTo,
    subject: `New Cosigo Coin Order: ${args.orderId}`,
    text: buildOwnerEmailText(args),
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Trusted server-side catalog lookup (don’t trust client price/name)
    const items = buildInvoiceItems(body.items)

    const subtotal_mxn = items.reduce((sum, it) => sum + it.line_total_mxn, 0)
    const cryptoQuote = await buildCryptoQuote(subtotal_mxn)

    const orderId = buildOrderId()
    const stamp = buildStamp()

    const order = {
      id: orderId,
      buildStamp: stamp,
      createdAt: new Date().toISOString(),
      currency: 'MXN' as const,
      subtotal_mxn,
      items,
      customer: body.customer || {},
      shipping: body.shipping || {},
      notes: body.notes || '',
      status: 'awaiting_crypto' as const,
      accepted: ['BTC', 'LTC', 'ETH'] as const,
      cryptoQuote,
    }

    const baseDir =
      process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')
    await fs.mkdir(baseDir, { recursive: true })
    await fs.writeFile(
      path.join(baseDir, `${orderId}.json`),
      JSON.stringify(order, null, 2),
      'utf8'
    )

    await maybeSendOwnerEmail({
      orderId,
      buildStamp: stamp,
      subtotal_mxn,
      items,
      customer: body.customer,
      shipping: body.shipping,
      cryptoQuote,
    })

    return NextResponse.json({ ok: true, orderId, redirect: `/order/${orderId}` })
  } catch (err: any) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}