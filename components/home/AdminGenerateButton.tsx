'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

export function AdminGenerateButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scenario/generate', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Üretilemedi.')
        setLoading(false)
        return
      }
      // Reload to show the new scenario
      window.location.reload()
    } catch (e) {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity"
        style={{
          background: 'linear-gradient(135deg, #1442a8, #2a6cf0)',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <Zap size={15} />
        {loading ? 'Üretiliyor…' : 'Bugünkü Senaryoyu Üret (AI)'}
      </button>
      {error && (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      )}
      <p className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>Sadece adminler görür</p>
    </div>
  )
}
