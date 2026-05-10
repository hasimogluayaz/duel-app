'use client'

import { useState, useEffect } from 'react'
import { Swords, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react'

interface CategoryStat {
  category: string
  wins: number
  losses: number
  total: number
  win_rate: number
}

interface MonthPoint { month: string; wins: number; total: number }

interface Stats {
  total: number
  wins: number
  losses: number
  win_rate: number
  current_streak: number
  best_category: CategoryStat | null
  worst_category: CategoryStat | null
  categories: CategoryStat[]
  monthly_trend: MonthPoint[]
  h2h?: { total: number; my_wins: number; their_wins: number } | null
}

const CAT_LABELS: Record<string, string> = {
  genel: '🌍 Genel', ask: '❤️ Aşk', is: '💼 İş', aile: '👨‍👩‍👧 Aile',
  sosyal: '👥 Sosyal', teknoloji: '💻 Teknoloji', dunya: '🌏 Dünya', mizah: '😂 Mizah', felsefe: '🤔 Felsefe',
}

interface Props { username: string; isOwnProfile?: boolean }

export default function DuelStatsPanel({ username, isOwnProfile }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/duel/stats?username=${username}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse" />)}
    </div>
  )
  if (!stats || stats.total === 0) return (
    <div className="text-center py-10 text-fg-subtle">
      <Swords size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">Henüz tamamlanmış düello yok</p>
    </div>
  )

  const maxMonthly = Math.max(...stats.monthly_trend.map(m => m.total), 1)

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Toplam', value: stats.total, color: 'text-fg' },
          { label: 'Kazanma', value: `%${stats.win_rate}`, color: 'text-green-400' },
          { label: 'Galibiyet', value: stats.wins, color: 'text-green-400' },
          { label: 'Mevcut Seri', value: `${stats.current_streak}🔥`, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-stroke rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-fg-subtle mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* H2H */}
      {stats.h2h && stats.h2h.total > 0 && (
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs text-primary/70 font-semibold mb-2 flex items-center gap-1.5">
            <Swords size={12} /> Aramızdaki Rekabet
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-green-400">{stats.h2h.my_wins}</p>
              <p className="text-xs text-fg-subtle">Senin galibin</p>
            </div>
            <div className="text-fg-subtle text-lg font-bold">vs</div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-red-400">{stats.h2h.their_wins}</p>
              <p className="text-xs text-fg-subtle">Onun galibi</p>
            </div>
          </div>
          <p className="text-center text-xs text-fg-subtle mt-2">{stats.h2h.total} düello toplam</p>
        </div>
      )}

      {/* Best / Worst category */}
      <div className="grid grid-cols-2 gap-3">
        {stats.best_category && (
          <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">En Güçlü</span>
            </div>
            <p className="text-sm font-bold text-fg">{CAT_LABELS[stats.best_category.category] ?? stats.best_category.category}</p>
            <p className="text-xs text-green-400 font-black">%{stats.best_category.win_rate} kazanma</p>
          </div>
        )}
        {stats.worst_category && stats.worst_category.category !== stats.best_category?.category && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={12} className="text-red-400" />
              <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">En Zayıf</span>
            </div>
            <p className="text-sm font-bold text-fg">{CAT_LABELS[stats.worst_category.category] ?? stats.worst_category.category}</p>
            <p className="text-xs text-red-400 font-black">%{stats.worst_category.win_rate} kazanma</p>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {stats.categories.length > 0 && (
        <div className="bg-surface border border-stroke rounded-2xl p-4">
          <p className="text-xs text-fg-subtle font-semibold mb-3 flex items-center gap-1.5">
            <BarChart3 size={12} /> Kategori Performansı
          </p>
          <div className="space-y-2">
            {stats.categories.slice(0, 6).map(cat => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-fg-muted">{CAT_LABELS[cat.category] ?? cat.category}</span>
                  <span className="text-xs font-bold text-fg-muted">{cat.wins}W {cat.losses}L</span>
                </div>
                <div className="h-1.5 bg-stroke rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cat.win_rate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${cat.win_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly trend mini chart */}
      <div className="bg-surface border border-stroke rounded-2xl p-4">
        <p className="text-xs text-fg-subtle font-semibold mb-3 flex items-center gap-1.5">
          <Target size={12} /> Son 6 Ay
        </p>
        <div className="flex items-end gap-1 h-16">
          {stats.monthly_trend.map(m => {
            const h = m.total > 0 ? Math.max(4, Math.round((m.total / maxMonthly) * 56)) : 4
            const wr = m.total > 0 ? Math.round((m.wins / m.total) * 100) : 0
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: 56 }}>
                  <div
                    className={`w-full rounded-sm transition-all ${wr >= 50 ? 'bg-green-500/60' : wr > 0 ? 'bg-red-500/60' : 'bg-stroke'}`}
                    style={{ height: h }}
                    title={`${m.total} düello, ${wr}% kazanma`}
                  />
                </div>
                <span className="text-[9px] text-fg-subtle">{m.month.slice(5)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
