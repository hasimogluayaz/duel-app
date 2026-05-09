'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, UserCircle } from 'lucide-react'

interface Props {
  hasAvatar: boolean
  hasBio: boolean
  hasDisplayName: boolean
}

export default function ProfileCompletionBanner({ hasAvatar, hasBio, hasDisplayName }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const missing = [
    !hasAvatar && 'fotoğraf',
    !hasBio && 'biyografi',
    !hasDisplayName && 'görünen isim',
  ].filter(Boolean)

  if (dismissed || missing.length === 0) return null

  const pct = Math.round(((hasAvatar ? 1 : 0) + (hasBio ? 1 : 0) + (hasDisplayName ? 1 : 0)) / 3 * 100)

  return (
    <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
        <UserCircle size={20} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-fg">Profilini Tamamla</p>
          <span className="text-xs font-bold text-violet-400">%{pct}</span>
        </div>
        <div className="h-1 bg-stroke rounded-full mb-1.5">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-fg-subtle">
          Eksik: {missing.join(', ')} — daha fazla takipçi çek!
        </p>
      </div>
      <Link
        href="/profil/ayarlar"
        className="shrink-0 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors"
      >
        Tamamla
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 text-fg-subtle hover:text-fg-muted transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
