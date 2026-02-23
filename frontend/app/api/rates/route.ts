import { NextResponse } from 'next/server'

type Rates = {
  mxnPerBtc: number
  mxnPerEth: number
  mxnPerLtc: number
  fetchedAt: string
}

let cache: { value: Rates; expiresAt: number } | null = null

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now < cache.expiresAt) {
      return NextResponse.json({ ok: true, rates: cache.value })
    }

    const url =
      'https://api.coingecko.com/api/v3/simple/price' +
      '?ids=bitcoin,ethereum,litecoin&vs_currencies=mxn'

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `CoinGecko ${res.status} ${res.statusText}` },
        { status: 502 }
      )
    }

    const data = (await res.json()) as any
    const mxnPerBtc = Number(data?.bitcoin?.mxn)
    const mxnPerEth = Number(data?.ethereum?.mxn)
    const mxnPerLtc = Number(data?.litecoin?.mxn)

    if (![mxnPerBtc, mxnPerEth, mxnPerLtc].every(Number.isFinite)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid rate payload' },
        { status: 502 }
      )
    }

    const rates: Rates = {
      mxnPerBtc,
      mxnPerEth,
      mxnPerLtc,
      fetchedAt: new Date().toISOString(),
    }

    cache = { value: rates, expiresAt: now + 60_000 }
    return NextResponse.json({ ok: true, rates })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'rates error' },
      { status: 500 }
    )
  }
}