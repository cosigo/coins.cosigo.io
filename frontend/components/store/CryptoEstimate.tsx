'use client'

import { useEffect, useState } from 'react'

type Rates = {
  mxnPerBtc: number
  mxnPerEth: number
  mxnPerLtc: number
  fetchedAt: string
}

function fmt(n: number, decimals: number) {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(decimals)
}

export default function CryptoEstimate({ subtotalMxn }: { subtotalMxn: number }) {
  const [rates, setRates] = useState<Rates | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/rates', { cache: 'no-store' })
        const json = await res.json()
        if (!alive) return
        if (!json?.ok) throw new Error(json?.error || 'rates failed')
        setRates(json.rates)
        setErr(null)
      } catch (e: any) {
        if (!alive) return
        setRates(null)
        setErr(e?.message || 'rates error')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (err) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm opacity-80">
        Crypto estimates unavailable ({err})
      </div>
    )
  }

  if (!rates) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm opacity-80">
        Loading crypto estimates…
      </div>
    )
  }

  const btc = subtotalMxn / rates.mxnPerBtc
  const eth = subtotalMxn / rates.mxnPerEth
  const ltc = subtotalMxn / rates.mxnPerLtc

  return (
    <div className="mt-4 rounded-xl border border-white/10 p-4">
      <div className="font-semibold mb-1">Estimated crypto (spot)</div>
      <div className="text-sm opacity-80 mb-3">
        Updated: {new Date(rates.fetchedAt).toLocaleString('es-MX')} · Network fees not included
      </div>
      <ul className="space-y-1 text-sm">
        <li>BTC: {fmt(btc, 8)}</li>
        <li>ETH: {fmt(eth, 6)}</li>
        <li>LTC: {fmt(ltc, 6)}</li>
      </ul>
    </div>
  )
}