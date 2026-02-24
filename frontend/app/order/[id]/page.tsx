import fs from 'fs/promises'
import path from 'path'
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

    const qrBTC = q?.uris?.BTC ? await QRCode.toDataURL(q.uris.BTC) : null
    const qrETH = q?.uris?.ETH ? await QRCode.toDataURL(q.uris.ETH) : null
    const qrLTC = q?.uris?.LTC ? await QRCode.toDataURL(q.uris.LTC) : null

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Order {order.id}</h1>
        <p className="mb-6 opacity-80">Status: {order.status}</p>

        <div className="space-y-2 mb-6">
          {order.items.map((item: any) => (
            <div key={item.slug}>
              {item.name_en} × {item.quantity}
            </div>
          ))}
        </div>

        <div className="font-semibold mb-8">
          Subtotal: ${(order.subtotal_mxn || order.subtotal || 0).toLocaleString()} MXN
        </div>

        {/* Locked crypto invoice */}
        <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <div className="text-lg font-semibold mb-1">Pay with crypto</div>

          <div className="mt-6 rounded-xl border border-white/10 p-4">
          <div className="font-medium mb-2">Customer</div>
          <div className="text-sm opacity-80">Email: {order.customer?.email || '—'}</div>
          <div className="text-sm opacity-80">Name: {order.shipping?.name || order.customer?.name || '—'}</div>
          <div className="text-sm opacity-80">
          Ship to: {order.shipping?.line1 || '—'}, {order.shipping?.city || '—'}, {order.shipping?.region || '—'} {order.shipping?.postal || '—'}, {order.shipping?.country || '—'}
        </div>
        </div>

          {q?.due ? (
            <>
              <div className="text-sm opacity-80 mb-4">
                Locked quote:{' '}
                {q.fetchedAt ? new Date(q.fetchedAt).toLocaleString('es-MX') : '—'}
                {' · '}
                Buffer: {q.bufferBps ?? '—'} bps
                {' · '}
                Network fees not included
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* BTC */}
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

                {/* ETH */}
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

                {/* LTC */}
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
                Send the quoted amount. Your order confirms after payment is received and confirmed on the network.
              </div>
            </>
          ) : (
            <div className="text-sm opacity-80">
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