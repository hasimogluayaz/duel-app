'use client'

import { useState, useEffect } from 'react'
import { ShieldOff, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Props {
  targetUserId: string
  initialBlocked?: boolean
}

export default function BlockButton({ targetUserId, initialBlocked = false }: Props) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  useEffect(() => {
    // Fetch current block status
    fetch(`/api/block?user_id=${targetUserId}`)
      .then(r => r.json())
      .then(d => setBlocked(d.blocked ?? false))
      .catch(() => {})
  }, [targetUserId])

  async function toggle() {
    setLoading(true)
    setConfirming(false)
    const res = await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_id: targetUserId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error || 'İşlem başarısız.', 'error'); return }
    setBlocked(json.blocked)
    toast(json.blocked ? 'Kullanıcı engellendi.' : 'Engel kaldırıldı.', 'success')
  }

  if (blocked) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <Shield size={12} />
        {loading ? '...' : 'Engeli Kaldır'}
      </button>
    )
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-red-400">Engelle?</span>
        <button
          onClick={toggle}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? '...' : 'Evet'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-fg-subtle hover:text-fg-muted border border-stroke px-2 py-1 rounded-lg"
        >
          Hayır
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-fg-subtle hover:text-red-400 border border-stroke hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
    >
      <ShieldOff size={12} />
      Engelle
    </button>
  )
}
