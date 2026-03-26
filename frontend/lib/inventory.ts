import 'server-only'
import path from 'path'
import fs from 'fs/promises'
import { findProductBySlug } from '@/lib/products/catalog'

type StoredOrderItem = {
  slug?: string
  quantity?: number
}

type StoredOrder = {
  createdAt?: string
  status?: string
  items?: StoredOrderItem[]
  cryptoQuote?: {
    expiresAt?: string
  }
}

const ORDER_DATA_DIR =
  process.env.ORDER_DATA_DIR || path.join(process.cwd(), 'data', 'orders')

const SOLD_STATUSES = new Set(['paid', 'fulfilled'])
const RESERVED_STATUSES = new Set(['awaiting_crypto'])

function getBaseStock(slug: string): number | null {
  const p = findProductBySlug(slug)
  if (!p) return null

  const raw = (p as any).stock
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null

  return Math.max(0, Math.floor(raw))
}

function isAwaitingOrderStillReserved(order: StoredOrder): boolean {
  if (!RESERVED_STATUSES.has(order.status || '')) return false

  const now = Date.now()

  const expiresAtMs = Date.parse(order.cryptoQuote?.expiresAt || '')
  if (Number.isFinite(expiresAtMs)) {
    return expiresAtMs > now
  }

  const createdAtMs = Date.parse(order.createdAt || '')
  const ttlSeconds = Number(process.env.CRYPTO_QUOTE_TTL_SECONDS || 7200)
  const ttlMs = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds * 1000 : 7200 * 1000

  if (Number.isFinite(createdAtMs)) {
    return createdAtMs + ttlMs > now
  }

  return false
}

function orderConsumesInventory(order: StoredOrder): boolean {
  if (SOLD_STATUSES.has(order.status || '')) return true
  if (isAwaitingOrderStillReserved(order)) return true
  return false
}

async function readAllOrders(): Promise<StoredOrder[]> {
  try {
    const names = await fs.readdir(ORDER_DATA_DIR)
    const jsonFiles = names.filter((n) => n.endsWith('.json'))

    const orders = await Promise.all(
      jsonFiles.map(async (name) => {
        try {
          const raw = await fs.readFile(path.join(ORDER_DATA_DIR, name), 'utf8')
          return JSON.parse(raw) as StoredOrder
        } catch {
          return null
        }
      })
    )

    return orders.filter(Boolean) as StoredOrder[]
  } catch {
    return []
  }
}

export async function getAvailableStockForSlug(slug: string): Promise<number | null> {
  const baseStock = getBaseStock(slug)
  if (baseStock === null) return null

  const orders = await readAllOrders()

  let committedQty = 0

  for (const order of orders) {
    if (!orderConsumesInventory(order)) continue
    if (!Array.isArray(order.items)) continue

    for (const item of order.items) {
      if (item.slug !== slug) continue

      const qty = Number(item.quantity || 0)
      if (Number.isFinite(qty) && qty > 0) {
        committedQty += qty
      }
    }
  }

  return Math.max(0, baseStock - committedQty)
}