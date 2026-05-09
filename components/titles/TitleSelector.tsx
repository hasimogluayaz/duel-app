'use client'

import { useState, useEffect } from 'react'
import { Crown, CheckCircle, Lock } from 'lucide-react'
import { TITLE_DEFINITIONS } from '@/lib/titles/config'

interface Props {
  userId: string
  currentTitle?: string | null
}

const ALL_TITLES = Object.entries(TITLE_DEFINITIONS).map(([title, def]) => ({ title, ...def }))

export default function TitleSelector({ userId, currentTitle }: Props) {
  const [earned, setEarned]   = useState<string[]>([])
  const [active, setActive]   = useState<string | null>(currentTitle ?? null)
  const [setting, setSetting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/titles')
      .then(r => r.json())
      .then(d => {
        setEarned((d.titles ?? []).map((t: any) => t.title))
        setActive(d.active_title ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function setTitle(title: string) {
    if (setting) return
    const newTitle = active === title ? '' : title
    setSetting(title)
    const res = await fetch('/api/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (res.ok) setActive(newTitle || null)
    setSetting(null)
  }

  if (loading) return <div className="h-48 bg-surface-2 rounded-2xl animate-pulse" />

  return (
    <div className="rounded-2xl bg-surface border border-stroke overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-stroke flex items-center gap-2">
        <Crown size={14} className="text-yellow-400" />
        <span className="text-sm font-bold text-fg">Unvanlar</span>
        {active && (
          <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
            Aktif: {ALL_TITLES.find(t => t.title === active)?.emoji} {ALL_TITLES.find(t => t.title === active)?.label}
          </span>
        )}
      </div>

      <div className="p-3 grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
        {ALL_TITLES.map(t => {
          const isEarned = earned.includes(t.title)
          const isActive = active === t.title
          const isPending = setting === t.title

          return (
            <button
              key={t.title}
              onClick={() => isEarned ? setTitle(t.title) : undefined}
              disabled={!isEarned || !!setting}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-violet-500/15 border border-violet-500/30'
                  : isEarned
                  ? 'bg-surface-2 border border-stroke hover:bg-stroke hover:border-purple-500/30 cursor-pointer'
                  : 'opacity-40 cursor-default bg-surface-2 border border-stroke'
              }`}
            >
              <span className="text-xl shrink-0">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isEarned ? 'text-fg' : 'text-fg-subtle'}`}>{t.label}</p>
                <p className="text-xs text-fg-subtle">{t.condition}</p>
              </div>
              <div className="shrink-0">
                {isPending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                ) : isActive ? (
                  <CheckCircle size={16} className="text-violet-400" />
                ) : !isEarned ? (
                  <Lock size={14} className="text-fg-subtle opacity-50" />
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {earned.length === 0 && (
        <div className="px-4 pb-4 text-center text-xs text-fg-subtle">
          Düello kazan, cevap ver ve seri yap — unvanlar otomatik kazanılır.
        </div>
      )}
    </div>
  )
}
