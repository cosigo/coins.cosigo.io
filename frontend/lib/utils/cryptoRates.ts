type Rates = {
  mxnPerBtc: number
  mxnPerEth: number
  mxnPerLtc: number
  fetchedAt: string // ISO
}

let cache: { value: Rates; expiresAt: number } | null = null

export async function getCryptoRatesMXN(): Promise<Rates> {
  const now = Date.now()
  if (cache && now < cache.expiresAt) return cache.value

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

  const value: Rates = {
    mxnPerBtc,
    mxnPerEth,
    mxnPerLtc,
    fetchedAt: new Date().toISOString(),
  }

  // cache 60 seconds to reduce calls
  cache = { value, expiresAt: now + 60_000 }
  return value
}