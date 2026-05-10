'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, MessageSquare } from 'lucide-react'

interface TrendingScenario {
  id: string
  content: string
  category: string
  answer_count: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  genel: '🌍', ask: '❤️', is: '💼', aile: '👨‍👩‍👧',
  sosyal: '👥', teknoloji: '💻', dunya: '🌏', mizah: '😂',
}

export default function TrendingScenarios() {
  const [scenarios, setScenarios] = useState<TrendingScenario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios/trending')
      .then((r) => r.json())
      .then((d) => { setScenarios(d.scenarios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="rounded-2xl bg-surface border border-stroke p-4 animate-pulse">
      <div className="h-4 bg-stroke rounded w-32 mb-3" />
      {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-stroke/50 rounded-xl mb-2" />)}
    </div>
  )

  if (scenarios.length === 0) return null

  return (
    <div className="rounded-2xl bg-surface border border-stroke overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stroke">
        <TrendingUp size={14} className="text-primary" />
        <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Son 48 Saatte Trend</span>
      </div>
      <div>
        {scenarios.map((s, i) => (
          <Link key={s.id} href={`/arsiv/${s.id}`}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-stroke/50 last:border-0 hover:bg-surface-2 transition-colors group">
              <span className="text-lg font-black text-fg-subtle/40 w-5 shrink-0 text-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-fg group-hover:text-primary/80 transition-colors line-clamp-2 leading-snug">
                  {s.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-fg-subtle">
                    {CATEGORY_EMOJI[s.category] ?? '📝'} {s.category}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-xs text-fg-subtle">
                <MessageSquare size={11} />
                {s.answer_count}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/arsiv" className="block px-4 py-3 text-xs text-center text-primary hover:text-primary/80 transition-colors">
        Tüm senaryoları gör →
      </Link>
    </div>
  )
}
