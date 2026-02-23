// app/api/checkout/stripe/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs' // ensure Node runtime (Stripe needs it)

type CartItem = {
  id?: string
  slug?: string
  name_en?: string
  quantity: number
  price_mxn: number
  images?: { obverse?: string }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const items = (body?.items || []) as CartItem[]
    const currency = (body?.currency || 'mxn') as string

    // If Stripe isn't configured, don't crash build or runtime.
    const secretKey = process.env.STRIPE_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://coins.cosigo.io'

    if (!secretKey || !publishableKey) {
      return NextResponse.json(
        {
          error:
            'Stripe is not configured on this server (missing STRIPE_SECRET_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).',
        },
        { status: 501 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Import + create Stripe ONLY inside the handler
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)

    const line_items = items.map((it) => {
      const qty = Number(it.quantity || 0)
      const price = Number(it.price_mxn || 0)

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('Invalid quantity')
      }
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('Invalid price')
      }

      const name = it.name_en || it.slug || it.id || 'Item'

      return {
        quantity: qty,
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name,
          },
          // Stripe expects integer minor units (MXN is 2 decimals)
          unit_amount: Math.round(price * 100),
        },
      }
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      // You can refine these later
      success_url: `${siteUrl}/checkout?success=1`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      // if you want OXXO, you'd add payment_method_types, etc.
    })

    return NextResponse.json({
      ok: true,
      url: session.url,
    })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
