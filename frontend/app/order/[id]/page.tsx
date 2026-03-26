import fs from 'fs/promises'
import path from 'path'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!id) return notFound()

  const baseDir = process.env.ORDER_DATA_DIR || '/srv/data/orders'
  const filePath = path.join(baseDir, `${id}.json`)

  try {
    const file = await fs.readFile(filePath, 'utf8')
    const order = JSON.parse(file)

    const q = order.cryptoQuote || null

    const ttlHrs =
      q?.ttlSeconds && Number.isFinite(q.ttlSeconds)
        ? Math.round((q.ttlSeconds / 3600) * 10) / 10
        : null

    const nowMs = Date.now()
    const expiresMs = q?.expiresAt ? Date.parse(q.expiresAt) : null
    const isExpired =
      typeof expiresMs === 'number' && Number.isFinite(expiresMs)
        ? nowMs > expiresMs
        : false

    const qrBTC = q?.uris?.BTC ? await QRCode.toDataURL(q.uris.BTC) : null
    const qrETH = q?.uris?.ETH ? await QRCode.toDataURL(q.uris.ETH) : null
    const qrLTC = q?.uris?.LTC ? await QRCode.toDataURL(q.uris.LTC) : null

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="Go to COSIGO store home"
              className="shrink-0 rounded-full border border-white/10 bg-black/20 p-2 transition hover:bg-black/30"
            >
              <Image
                src="/cosigo_master_128.png"
                alt="COSIGO seal"
                width={64}
                height={64}
                priority
                className="h-16 w-16 rounded-full object-contain"
              />
            </Link>

            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.24em] text-white/60">
                Verified Store Order
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-[0.18em]">
                COSIGO
              </div>
              <div className="text-sm sm:text-base text-white/80 italic">
                Our Trusted Choice
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Order {order.id}</h1>
        <p className="mb-6 opacity-80">Status: {order.status}</p>

        <div className="space-y-2 mb-6">
          {order.items.map((item: any) => (
            <div key={item.slug}>
              {item.name_en} × {item.quantity}
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">Subtotal</span>
            <span>${(order.subtotal_mxn || order.subtotal || 0).toLocaleString()} MXN</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">
              Shipping {order.shipping_rate_type === 'domestic' ? '(Mexico)' : '(International)'}
            </span>
            <span>${(order.shipping_mxn || 0).toLocaleString()} MXN</span>
          </div>

          <div className="border-t border-white/10 pt-2 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>
              ${(
                order.total_mxn ||
                ((order.subtotal_mxn || order.subtotal || 0) + (order.shipping_mxn || 0))
              ).toLocaleString()} MXN
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <div className="text-lg font-semibold mb-1">Pay with crypto</div>

          <div className="mt-6 rounded-xl border border-white/10 p-4">
            <div className="font-medium mb-2">Customer</div>
            <div className="text-sm opacity-80">Email: {order.customer?.email || '—'}</div>
            <div className="text-sm opacity-80">
              Name: {order.shipping?.name || order.customer?.name || '—'}
            </div>
            <div className="text-sm opacity-80">
              Ship to: {order.shipping?.line1 || '—'}, {order.shipping?.city || '—'},{' '}
              {order.shipping?.region || '—'} {order.shipping?.postal || '—'},{' '}
              {order.shipping?.country || '—'}
            </div>
          </div>

          {q?.due ? (
            isExpired ? (
              <div className="text-sm opacity-80 mt-4">
                This crypto quote has expired.
                {q?.expiresAt ? (
                  <>
                    {' '}
                    Expired at: {new Date(q.expiresAt).toLocaleString('es-MX')}.
                  </>
                ) : null}
                <div className="mt-2">
                  Please create a new order to get a fresh quote.
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm opacity-80 mb-4 mt-4">
                  Locked quote{ttlHrs ? ` for ${ttlHrs} hours` : ''}:{' '}
                  {q.fetchedAt ? new Date(q.fetchedAt).toLocaleString('es-MX') : '—'}
                  {' · '}
                  Buffer: {q.bufferBps ?? '—'} bps
                  {q.expiresAt ? (
                    <>
                      {' · '}Expires: {new Date(q.expiresAt).toLocaleString('es-MX')}
                    </>
                  ) : null}
                  {' · '}
                  Network fees not included
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 p-4">
                    <div className="font-medium mb-1">BTC</div>
                    <div className="text-sm mb-2">{q.due.BTC}</div>
                    <code className="break-all text-xs opacity-80">
                      {q.addresses?.BTC || '(missing address)'}
                    </code>
                    {qrBTC && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrBTC} alt="BTC QR" className="mt-3 w-40 h-40" />
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 p-4">
                    <div className="font-medium mb-1">ETH</div>
                    <div className="text-sm mb-2">{q.due.ETH}</div>
                    <code className="break-all text-xs opacity-80">
                      {q.addresses?.ETH || '(missing address)'}
                    </code>
                    {qrETH && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrETH} alt="ETH QR" className="mt-3 w-40 h-40" />
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 p-4">
                    <div className="font-medium mb-1">LTC</div>
                    <div className="text-sm mb-2">{q.due.LTC}</div>
                    <code className="break-all text-xs opacity-80">
                      {q.addresses?.LTC || '(missing address)'}
                    </code>
                    {qrLTC && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrLTC} alt="LTC QR" className="mt-3 w-40 h-40" />
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs opacity-80">
                  Send the quoted amount. Your order confirms after payment is received and
                  confirmed on the network.
                </div>
              </>
            )
          ) : (
            <div className="text-sm opacity-80 mt-4">
              Crypto quote unavailable for this order.
            </div>
          )}
        </div>
      </main>
    )
  } catch {
    return notFound()
  }
}