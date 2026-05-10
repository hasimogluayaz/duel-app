'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

interface Props {
  duelId: string
  opponentName?: string
}

export default function RematchButton({ duelId, opponentName }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const request = async () => {
    if (loading || sent) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/duel/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duel_id: duelId }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Bir hata oluştu.')
      } else {
        setSent(true)
        // Navigate to new duel after brief delay
        setTimeout(() => {
          if (d.duel?.share_token) router.push(`/duel/${d.duel.share_token}`)
        }, 1200)
      }
    } catch {
      setError('Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
      <RotateCcw size={14} />
      <span>Rövanş talebi gönderildi!</span>
    </div>
  )

  return (
    <div>
      <button
        onClick={request}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-primary/70 border border-stroke hover:border-primary/40 rounded-xl px-4 py-2.5 transition-all disabled:opacity-40 hover:bg-primary/5"
      >
        <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Gönderiliyor...' : `Rövanş${opponentName ? ` (${opponentName})` : ''}`}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
