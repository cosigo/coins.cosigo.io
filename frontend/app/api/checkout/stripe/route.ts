import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
})

export async function POST(req: Request) {
  try {
    const body = await req.json() as any
    const items = body.items as any[]
    const currency = body.currency as string
    const orderId = body.orderId as string | undefined

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map((item: any) => ({
        quantity: item.qty ?? item.quantity ?? 1,
        price_data: {
          currency,
          product_data: {
            name: item.title ?? item.name_en ?? item.slug ?? 'Item',
            description: item.metal && item.weight_g
              ? `${item.weight_g} g · ${item.metal}`
              : undefined,
          },
          unit_amount: item.priceCents
            ? item.priceCents
            : Math.round((item.price_mxn ?? 0) * 100),
        },
      }))

    const session = await (stripe as any).checkout.sessions.create({
      mode: 'payment',
      payment_method_types:
        currency === 'mxn'
          ? ['card', 'oxxo']
          : ['card'],
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
      metadata: orderId
        ? {
            source: 'coins.cosigo.io',
            orderId: String(orderId),
          }
        : {
            source: 'coins.cosigo.io',
          },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: err?.message || 'Stripe error' },
      { status: 500 }
    )
  }
}
