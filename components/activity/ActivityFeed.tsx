'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Swords, MessageSquare, ThumbsUp, UserPlus, Trophy, Flame, Star, Zap } from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  created_at: string
  data: Record<string, any>
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: (d: any) => string }> = {
  duel_won:         { icon: Trophy,        color: 'text-yellow-400', label: d => `"${d.scenario_snippet ?? 'Senaryo'}" düellosunu kazandı` },
  duel_lost:        { icon: Swords,        color: 'text-red-400',    label: d => `"${d.scenario_snippet ?? 'Senaryo'}" düellosunda yenildi` },
  duel_created:     { icon: Swords,        color: 'text-violet-400', label: _d => `Yeni bir düello başlattı` },
  answer_posted:    { icon: MessageSquare, color: 'text-blue-400',   label: d => `"${d.scenario_snippet ?? 'Senaryo'}" için cevap verdi` },
  answer_voted:     { icon: ThumbsUp,      color: 'text-green-400',  label: d => `Cevabı ${d.votes ?? 0} oy aldı` },
  followed:         { icon: UserPlus,      color: 'text-pink-400',   label: d => `${d.target_username ?? 'birini'} takip etmeye başladı` },
  streak_milestone: { icon: Flame,         color: 'text-orange-400', label: d => `${d.streak ?? 0} günlük seri madalyası kazandı` },
  title_earned:     { icon: Star,          color: 'text-amber-400',  label: d => `"${d.title_label ?? 'Yeni unvan'}" unvanını kazandı` },
  level_up:         { icon: Zap,           color: 'text-cyan-400',   label: _d => `Seviye atladı` },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min}dk önce`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}sa önce`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}g önce`
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

interface Props {
  username: string
  limit?: number
}

export default function ActivityFeed({ username, limit = 20 }: Props) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activity?username=${username}&limit=${limit}`)
      .then(r => r.json())
      .then(d => { setItems(d.activities ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [username, limit])

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-surface-2 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-surface-2 rounded w-3/4" />
            <div className="h-2 bg-surface-2 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )

  if (items.length === 0) return (
    <div className="text-center py-10 text-fg-subtle">
      <Flame size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">Henüz aktivite yok</p>
    </div>
  )

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const cfg = TYPE_CONFIG[item.type] ?? { icon: Zap, color: 'text-fg-subtle', label: () => item.type }
        const Icon = cfg.icon
        const label = cfg.label(item.data ?? {})

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 px-1 py-2.5 hover:bg-surface-2 rounded-xl transition-colors"
          >
            {/* Icon bubble */}
            <div className={`w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0 ${cfg.color}`}>
              <Icon size={14} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-fg-muted leading-snug">{label}</p>
              {item.data?.duel_id && (
                <Link
                  href={`/duel/${item.data.duel_id}`}
                  className="text-xs text-violet-400 hover:underline mt-0.5 inline-block"
                >
                  Düelloyu gör →
                </Link>
              )}
            </div>

            {/* Time */}
            <span className="text-[10px] text-fg-subtle shrink-0 mt-0.5">{timeAgo(item.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
