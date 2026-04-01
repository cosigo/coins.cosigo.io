'use client'

import { useEffect, useState } from 'react'
import { CartItem, getCart, clearCart } from '@/lib/cart'
import Link from 'next/link'
import CryptoEstimate from '@/components/store/CryptoEstimate'

const DOMESTIC_SHIPPING_MXN = 400
const INTERNATIONAL_SHIPPING_MXN = 800

function isMexico(country: string) {
  const c = String(country || '').trim().toUpperCase()
  return c === 'MX' || c === 'MEXICO' || c === 'MÉXICO'
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<
    'stripe' | 'crypto' | 'mercadopago'
  >('stripe')

  const [customer, setCustomer] = useState({
    email: '',
    name: '',
    phone: '',
  })

  const [shipping, setShipping] = useState({
    name: '',
    line1: '',
    city: '',
    region: '',
    postal: '',
    country: '',
  })

  const BTC_ADDR =
    process.env.NEXT_PUBLIC_BTC_ADDRESS ||
    'bc1qrr0rnfauvxndj4pf7pcgluhas939egxv4g9zs9'
  const ETH_ADDR =
    process.env.NEXT_PUBLIC_ETH_ADDRESS ||
    '0x0d7f0ec7d6baed0e82f4f759342868936f8cdc3e'
  const LTC_ADDR =
    process.env.NEXT_PUBLIC_LTC_ADDRESS ||
    'ltc1q0xsnfhzrqzpkegtt60kq9vhpdhvgu0e69tjqn6'

  useEffect(() => {
    setItems(getCart())
  }, [])

  const subtotal = items.reduce(
    (sum, item) => sum + item.price_mxn * item.quantity,
    0
  )

  const shippingMxn = !shipping.country.trim()
    ? 0
    : isMexico(shipping.country)
      ? DOMESTIC_SHIPPING_MXN
      : INTERNATIONAL_SHIPPING_MXN

  const totalMxn = subtotal + shippingMxn

  async function startMercadoPagoCheckout() {
    const cart = items.map((item) => ({
      slug: item.id,
      name: item.name_en,
      quantity: item.quantity,
      price: item.price_mxn,
    }))

    const res = await fetch('/api/checkout/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart }),
    })

    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else alert(data?.error || 'Unable to start Mercado Pago checkout')
  }

  async function createCryptoInvoice() {
    // validate ONLY when clicking the button
    if (!customer.email) {
      alert('Email is required')
      return
    }

    if (!shipping.name || !shipping.line1 || !shipping.city || !shipping.country) {
      alert('Shipping address is incomplete')
      return
    }

    const payload = {
      items: items.map((it) => ({
        slug: it.id, // id === slug
        quantity: it.quantity,
      })),
      customer: {
        email: customer.email,
        name: shipping.name || customer.name,
        phone: customer.phone,
      },
      shipping,
      notes: 'checkout:crypto',
    }

    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data?.ok) {
      const id = data.orderId || data.id || data.order?.id
      if (!id) {
        alert('Order created but response did not include an order id')
        return
      }
      clearCart()
      window.location.href = `/order/${id}`
      return
    }

    alert(data?.error || 'Unable to create crypto invoice')
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        <p className="text-gray-600 mb-6">Your cart is empty.</p>
        <Link href="/" className="underline">
          Return to store
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
      {/* LEFT */}
      <div className="md:col-span-2 space-y-8">
        <h1 className="text-2xl font-semibold">Checkout</h1>

        {/* Customer */}
        <section>
          <h2 className="font-medium mb-4">Customer information</h2>
          <div className="grid gap-4">
            <input
              className="border p-2 rounded"
              placeholder="Email address"
              value={customer.email}
              onChange={(e) => setCustomer((v) => ({ ...v, email: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Phone (recommended)"
              value={customer.phone}
              onChange={(e) => setCustomer((v) => ({ ...v, phone: e.target.value }))}
            />
          </div>
        </section>

        {/* Shipping */}
        <section>
          <h2 className="font-medium mb-4">Shipping address</h2>
          <div className="grid gap-4">
            <input
              className="border p-2 rounded"
              placeholder="Full name"
              value={shipping.name}
              onChange={(e) => setShipping((v) => ({ ...v, name: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Street address"
              value={shipping.line1}
              onChange={(e) => setShipping((v) => ({ ...v, line1: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="City"
              value={shipping.city}
              onChange={(e) => setShipping((v) => ({ ...v, city: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="State / Region"
              value={shipping.region}
              onChange={(e) => setShipping((v) => ({ ...v, region: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Postal code"
              value={shipping.postal}
              onChange={(e) => setShipping((v) => ({ ...v, postal: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Country (Mexico or Unites States)"
              value={shipping.country}
              onChange={(e) => setShipping((v) => ({ ...v, country: e.target.value }))}
            />

            <p className="text-sm text-gray-600">
              {!shipping.country.trim()
                ? 'Enter country to calculate shipping.'
                : isMexico(shipping.country)
                  ? `Shipping: $${DOMESTIC_SHIPPING_MXN.toLocaleString()} MXN (Mexico)`
                  : `Shipping: $${INTERNATIONAL_SHIPPING_MXN.toLocaleString()} MXN (International)`}
            </p>
          </div>
        </section>

        {/* Payment method */}
        <section>
          <h2 className="font-medium mb-4">Payment method</h2>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
              />
              Card / OXXO (Stripe)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'crypto'}
                onChange={() => setPaymentMethod('crypto')}
              />
              Pay with Crypto
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'mercadopago'}
                onChange={() => setPaymentMethod('mercadopago')}
              />
              Mercado Pago
            </label>
          </div>
        </section>

        {/* Crypto instructions */}
        {paymentMethod === 'crypto' && (
          <section className="border rounded-lg p-4">
            <h2 className="font-medium mb-4">Pay with Crypto</h2>

            <div className="grid gap-3 text-sm">
              {/* ETH */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">ETH</span>
                  <code className="break-all text-xs">{ETH_ADDR}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(ETH_ADDR)
                    alert('Address copied')
                  }}
                  className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>

              {/* BTC */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">BTC</span>
                  <code className="break-all text-xs">{BTC_ADDR}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(BTC_ADDR)
                    alert('Address copied')
                  }}
                  className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>

              {/* LTC */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">LTC</span>
                  <code className="break-all text-xs">{LTC_ADDR}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(LTC_ADDR)
                    alert('Address copied')
                  }}
                  className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Amounts shown are spot estimates (network fees not included). Create
              the crypto invoice to lock the quoted amounts.
            </p>
          </section>
        )}
      </div>

      {/* RIGHT */}
      <aside className="border rounded-lg p-4 h-fit">
        <h2 className="font-medium mb-4">Order summary</h2>

        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name_en} × {item.quantity}
              </span>
              <span>${(item.price_mxn * item.quantity).toLocaleString()} MXN</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()} MXN</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>
              {!shipping.country.trim()
                ? 'Shipping'
                : isMexico(shipping.country)
                  ? 'Shipping (Mexico)'
                  : 'Shipping (International)'}
            </span>
            <span>
              {!shipping.country.trim()
                ? 'Enter country'
                : `$${shippingMxn.toLocaleString()} MXN`}
            </span>
          </div>

          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${totalMxn.toLocaleString()} MXN</span>
          </div>
        </div>

        {paymentMethod === 'crypto' && <CryptoEstimate subtotalMxn={totalMxn} />}

        {paymentMethod === 'stripe' && (
          <button
            onClick={async () => {
              const res = await fetch('/api/checkout/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, currency: 'mxn' }),
              })

              const data = await res.json()
              if (data.url) window.location.href = data.url
              else alert(data?.error || 'Unable to start checkout')
            }}
            className="w-full mt-6 py-3 bg-black text-white rounded"
          >
            Place order
          </button>
        )}

        {paymentMethod === 'mercadopago' && (
          <button
            onClick={startMercadoPagoCheckout}
            className="w-full mt-6 py-3 bg-black text-white rounded"
          >
            Pay with Mercado Pago
          </button>
        )}

        {paymentMethod === 'crypto' && (
          <div className="mt-6">
            <button
              onClick={createCryptoInvoice}
              className="w-full py-3 bg-black text-white rounded"
            >
              Create crypto invoice
            </button>

            <div className="mt-3 text-sm text-gray-600">
              You’ll be redirected to an invoice page with locked BTC/ETH/LTC
              amounts and QR codes.
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}