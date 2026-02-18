export async function fetchBtcMxn(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=mxn',
    { cache: 'no-store' }
  )

  if (!res.ok) throw new Error('Failed to fetch BTC price')

  const data = await res.json()
  return data.bitcoin.mxn
}

export function mxnToBtc(priceMxn: number, btcMxn: number): number {
  return priceMxn / btcMxn
}
