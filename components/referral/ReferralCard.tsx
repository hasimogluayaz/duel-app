'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, CheckCircle, Gift, ChevronRight } from 'lucide-react'

interface Props {
  userId: string
}

export default function ReferralCard({ userId }: Props) {
  const [code, setCode]     = useState<string | null>(null)
  const [count, setCount]   = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => {
        setCode(d.referral_code ?? d.code ?? null)
        setCount(d.referral_count ?? d.count ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function copyLink() {
    const link = `${window.location.origin}/kayit?ref=${code}`
    if (navigator.share) {
      navigator.share({ title: 'Kapisio', text: 'Davet kodum:', url: link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  if (loading) return (
    <div className="rounded-2xl bg-surface border border-stroke p-4 animate-pulse h-24" />
  )

  return (
    <div className="rounded-2xl bg-surface border border-green-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-green-400" />
          <span className="text-sm font-bold text-fg">Arkadaşını Davet Et</span>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1 text-xs text-green-400">
            <Users size={10} />
            <span>{count} davet</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Description */}
        <p className="text-xs text-fg-subtle leading-relaxed">
          Arkadaşın senin kodunla kayıt olursa <span className="text-green-400 font-semibold">ikiniz de +100 puan</span> kazanırsınız!
        </p>

        {/* Code + copy button */}
        {code && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-2 border border-stroke rounded-xl px-3 py-2">
              <p className="text-[10px] text-fg-subtle mb-0.5">Davet Kodun</p>
              <p className="font-mono font-black text-fg tracking-widest text-sm">{code.toUpperCase()}</p>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
            >
              {copied ? <><CheckCircle size={12} /> Kopyalandı!</> : <><Copy size={12} /> Paylaş</>}
            </button>
          </div>
        )}

        {/* Milestone */}
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>Sonraki ödül: 5 davet</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-4 h-1.5 rounded-full ${i <= count ? 'bg-green-500' : 'bg-stroke'}`} />
              ))}
            </div>
            <ChevronRight size={10} />
            <span className="text-green-400 font-semibold">+500 puan</span>
          </div>
        </div>
      </div>
    </div>
  )
}
