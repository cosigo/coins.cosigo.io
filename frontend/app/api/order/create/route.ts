import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import type { CartItem } from '@/lib/cart'
import { findProductBySlug } from '@/lib/products/catalog'

const ABUSE_DIR = process.env.ABUSE_DATA_DIR || '/srv/data/abuse'
const LOCKS_FILE = path.join(ABUSE_DIR, 'locks.json')
const ATTEMPTS_FILE = path.join(ABUSE_DIR, 'attempts.jsonl')

type Lock = { until: string; reason: string }
type Locks = { ip?: Record<string, Lock>; email?: Record<string, Lock> }

function nowIso() {
  return new Date().toISOString()
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

async function readLocks(): Promise<Locks> {
  try {
    const raw = await fs.readFile(LOCKS_FILE, 'utf8')
    return JSON.parse(raw) as Locks
  } catch {
    return {}
  }
}

async function writeLocks(locks: Locks) {
  await fs.mkdir(ABUSE_DIR, { recursive: true })
  await fs.writeFile(LOCKS_FILE, JSON.stringify(locks, null, 2), 'utf8')
}

function isLocked(lock?: Lock) {
  if (!lock?.until) return false
  const untilMs = Date.parse(lock.until)
  return Number.isFinite(untilMs) && Date.now() < untilMs
}

async function appendAttempt(rec: any) {
  await fs.mkdir(ABUSE_DIR, { recursive: true })
  await fs.appendFile(ATTEMPTS_FILE, JSON.stringify(rec) + '\n', 'utf8')
}

async function countRecentAttempts(opts: {
  ipKey?: string
  emailKey?: string
  windowMs: number
}) {
  // cheap scan; fine for low volume. (If it grows, swap to sqlite.)
  let raw = ''
  try {
    raw = await fs.readFile(ATTEMPTS_FILE, 'utf8')
  } catch {
    return 0
  }

  const cutoff = Date.now() - opts.windowMs
  let count = 0

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const r = JSON.parse(line)
      const t = Date.parse(r.attemptedAt || '')
      if (!Number.isFinite(t) || t < cutoff) continue
      if (opts.ipKey && r.ipKey === opts.ipKey) count++
      if (opts.emailKey && r.emailKey === opts.emailKey) count++
    } catch {}
  }
  return count
}

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
  expiresAt: string        // ✅ add
  ttlSeconds: number       // ✅ add
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

  return {
    mxnPerBtc,
    mxnPerEth,
    mxnPerLtc,
    fetchedAt: new Date().toISOString(),
  }
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

    if (typeof price_mxn !== 'number')
      throw new Error(`Product missing price_mxn: ${p.slug}`)
    if (typeof weight_g !== 'number')
      throw new Error(`Product missing weight_g: ${p.slug}`)
    if (typeof name_en !== 'string')
      throw new Error(`Product missing name_en: ${p.slug}`)
    if (typeof metal !== 'string')
      throw new Error(`Product missing metal: ${p.slug}`)

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

  // 2 hours default (7200). If you want 24h, set 86400.
  const ttlRaw = Number(process.env.CRYPTO_QUOTE_TTL_SECONDS || 7200)
  const ttlSeconds = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 7200

  // public addresses are fine as NEXT_PUBLIC_*
  const addrBTC = process.env.NEXT_PUBLIC_BTC_ADDRESS || ''
  const addrETH = process.env.NEXT_PUBLIC_ETH_ADDRESS || ''
  const addrLTC = process.env.NEXT_PUBLIC_LTC_ADDRESS || ''

  try {
    const rates = await fetchMxnRatesCoingecko()

    const fetchedAtMs = Date.parse(rates.fetchedAt)
    const baseMs = Number.isFinite(fetchedAtMs) ? fetchedAtMs : Date.now()
    const expiresAt = new Date(baseMs + ttlSeconds * 1000).toISOString()

    const btc = ceilToDecimals((subtotal_mxn / rates.mxnPerBtc) * bufferMult, 8)
    const eth = ceilToDecimals((subtotal_mxn / rates.mxnPerEth) * bufferMult, 6)
    const ltc = ceilToDecimals((subtotal_mxn / rates.mxnPerLtc) * bufferMult, 6)

    return {
      provider: 'coingecko',
      fetchedAt: rates.fetchedAt,
      expiresAt,
      ttlSeconds,
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
  const { orderId, buildStamp, subtotal_mxn, items, customer, shipping, cryptoQuote } =
    args

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

async function maybeSendCustomerEmail(args: {
  orderId: string
  subtotal_mxn: number
  items: InvoiceItem[]
  customer?: CreateOrderBody['customer']
  shipping?: CreateOrderBody['shipping']
  cryptoQuote: CryptoQuote | null
}) {
  const enabled = (process.env.SEND_CUSTOMER_EMAILS || '0') === '1'
  if (!enabled) return

  const to = args.customer?.email?.trim()
  if (!to) return

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.CUSTOMER_FROM_EMAIL || process.env.SMTP_FROM

  if (!(host && user && pass && from)) return

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const lines = args.items
    .map((it) => `- ${it.name_en} x${it.quantity} = ${money(it.line_total_mxn)}`)
    .join('\n')

  const ship = args.shipping || {}
  const q = args.cryptoQuote

  const ttlHrs =
    q?.ttlSeconds && Number.isFinite(q.ttlSeconds)
      ? Math.round((q.ttlSeconds / 3600) * 10) / 10
      : null

  const expiresText = q?.expiresAt
    ? new Date(q.expiresAt).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const lockedLabel = ttlHrs ? `locked quote for ${ttlHrs} hours` : 'locked quote'

  const payText = q?.due
    ? `\nCrypto due (${lockedLabel}):\n` +
      `BTC: ${q.due.BTC}\n` +
      `ETH: ${q.due.ETH}\n` +
      `LTC: ${q.due.LTC}\n` +
      (expiresText ? `Expires: ${expiresText}\n` : '')
    : `\nCrypto quote unavailable for this order.\n`

  const orderLink = `https://coins.cosigo.io/order/${args.orderId}`

  await transporter.sendMail({
    from,
    to,
    subject: `Cosigo Coins — Order ${args.orderId} (awaiting crypto)`,
    text:
      `Thanks for your order.\n\n` +
      `Order: ${args.orderId}\n` +
      `Status: awaiting_crypto\n` +
      `Subtotal: ${money(args.subtotal_mxn)}\n\n` +
      `Items:\n${lines}\n\n` +
      `Ship to:\n` +
      `${ship.name || ''}\n` +
      `${ship.line1 || ''}\n` +
      `${ship.city || ''}, ${ship.region || ''} ${ship.postal || ''}\n` +
      `${ship.country || ''}\n` +
      payText +
      `\nOrder page:\n${orderLink}\n`,
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const h = req.headers

// Prefer X-Forwarded-For if behind Caddy / reverse proxy
const xff = req.headers.get('x-forwarded-for') || ''
const xri = req.headers.get('x-real-ip') || ''
const ip = (xff.split(',')[0] || xri || 'unknown').trim()

const email = (body.customer?.email || '').trim().toLowerCase()
const ipKey = sha256(`ip:${ip}`)
const emailKey = email ? sha256(`email:${email}`) : undefined

const locks = await readLocks()

const ipLock = locks.ip?.[ipKey]
if (isLocked(ipLock)) {
  return NextResponse.json({ error: `Too many attempts. Try again later.` }, { status: 429 })
}

if (emailKey) {
  const emailLock = locks.email?.[emailKey]
  if (isLocked(emailLock)) {
    return NextResponse.json({ error: `Too many attempts for this email. Try again later.` }, { status: 429 })
  }
}

// record attempt (even if we later reject for other reasons)
await appendAttempt({ attemptedAt: nowIso(), ipKey, emailKey })

// IP thresholds (30 min window)
  const ipCount = await countRecentAttempts({ ipKey, windowMs: 30 * 60 * 1000 })
  if (ipCount >= 20) {
  const until = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
  locks.ip = locks.ip || {}
  locks.ip[ipKey] = { until, reason: 'rate-limit-ip' }
  await writeLocks(locks)
  return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
}

// Email thresholds (2 hour window)
if (emailKey) {
  const emailCount = await countRecentAttempts({ emailKey, windowMs: 2 * 60 * 60 * 1000 })
  if (emailCount >= 6) {
    const until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    locks.email = locks.email || {}
    locks.email[emailKey] = { until, reason: 'rate-limit-email' }
    await writeLocks(locks)
    return NextResponse.json({ error: 'Too many attempts for this email. Try again later.' }, { status: 429 })
  }
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

    try {
      await maybeSendCustomerEmail({
        orderId,
        subtotal_mxn,
        items,
        customer: body.customer,
        shipping: body.shipping,
        cryptoQuote,
      })
    } catch (e) {
      console.error('Customer email failed:', e)
    }

    return NextResponse.json({ ok: true, orderId, redirect: `/order/${orderId}` })
  } catch (err: any) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}