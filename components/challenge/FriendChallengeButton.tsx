'use client'

import { useState } from 'react'
import { Users, Copy, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  scenarioId: string
  answerId: string
  userId: string
}

export default function FriendChallengeButton({ scenarioId, answerId, userId }: Props) {
  const [link, setLink]       = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')

  async function createLink() {
    if (link) { copyLink(); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/arkadas-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, answer_id: answerId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Bir hata oluştu.'); return }
    const url = `${window.location.origin}/arkadas/${data.token}`
    setLink(url)
    copyToClipboard(url)
  }

  function copyLink() {
    if (link) copyToClipboard(link)
  }

  function copyToClipboard(text: string) {
    if (navigator.share) {
      navigator.share({
        title: 'Duel — Meydan Okuma!',
        text: 'Sen olsan ne yapardın? Cevabını ver, uyumumuzu görelim 🎯',
        url: text,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  return (
    <div className="mt-3">
      {link ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 truncate font-mono">
            {link}
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
          >
            {copied ? <><CheckCircle size={12} /> Kopyalandı!</> : <><Copy size={12} /> Kopyala</>}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={createLink}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all w-full justify-center"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Link oluşturuluyor...</>
              : <><Users size={14} /> Arkadaşına Meydan Oku 🎯</>
            }
          </button>
          {error && <p className="text-xs text-red-400 mt-1 text-center">{error}</p>}
        </>
      )}
      {link && (
        <p className="text-xs text-white/30 text-center mt-2">
          Bu link 7 gün geçerli. Arkadaşın cevaplayınca uyum skorunu görürsün.
        </p>
      )}
    </div>
  )
}
