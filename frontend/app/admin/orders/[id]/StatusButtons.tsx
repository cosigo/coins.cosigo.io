'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  'paid',
  'fulfilled',
  'expired',
  'cancelled',
  'returned',
] as const

export default function StatusButtons({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function updateStatus(status: string) {
    try {
      setBusy(true)
      setMessage('')

      const res = await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data?.error || 'Status update failed')
        return
      }

      setMessage(`Status updated to: ${status}`)
      router.refresh()
    } catch (err: any) {
      setMessage(err?.message || 'Status update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-sm text-white/70">
        Current status: <span className="font-semibold text-white">{currentStatus}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(status)}
            disabled={busy || currentStatus === status}
            className="rounded-md border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark {status}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-3 text-sm text-white/80">{message}</p>
      ) : null}
    </div>
  )
}