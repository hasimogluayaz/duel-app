'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import Link from 'next/link'
import { Trophy, Swords } from 'lucide-react'

type Period = 'weekly' | 'monthly' | 'all_time' | 'friends'

interface Entry {
  rank: number
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  points: number
  personality_type: string | null
  active_title?: string | null
  win_count: number
  duel_count: number
  is_me?: boolean
}

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'Bu Hafta',
  monthly: 'Bu Ay',
  all_time: 'Tüm Zamanlar',
  friends: 'Arkadaşlar',
}

const PERIOD_ICONS: Record<Period, string> = {
  weekly: '🔥',
  monthly: '📅',
  all_time: '👑',
  friends: '👥',
}

const MEDAL = ['🥇', '🥈', '🥉']
const PODIUM_COLORS = [
  'from-amber-500/20 to-amber-600/5 border-amber-500/40',
  'from-zinc-400/15 to-zinc-500/5 border-zinc-400/30',
  'from-orange-500/15 to-orange-600/5 border-orange-500/30',
]

export default function LiderlikPage() {
  const [period, setPeriod] = useState<Period>('weekly')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [myEntry, setMyEntry] = useState<Entry | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [period])

  async function loadLeaderboard() {
    setLoading(true)
    const res = await fetch(`/api/leaderboard?period=${period}`)
    const json = await res.json()
    setEntries(json.entries ?? [])
    setMyEntry(json.myEntry ?? null)
    setLoading(false)
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Trophy size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Liderlik Tablosu</h1>
          <p className="text-sm text-fg-subtle">En iyi düellucular sıralanıyor</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex bg-surface border border-stroke rounded-xl p-1 mb-6 gap-1 overflow-x-auto">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 min-w-max py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              period === p
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            }`}
          >
            <span>{PERIOD_ICONS[p]}</span>
            <span className="hidden sm:inline">{PERIOD_LABELS[p]}</span>
            <span className="sm:hidden">{PERIOD_LABELS[p].split(' ')[1] || PERIOD_LABELS[p]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Trophy size={36} className="text-fg-subtle mx-auto mb-3 opacity-40" />
          <p className="text-fg font-semibold">Henüz sıralama yok</p>
          <p className="text-fg-subtle text-sm mt-1">Düelloya gir ve sıralamada yerini al!</p>
          <Link href="/oyun" className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            Oynamaya başla →
          </Link>
        </Card>
      ) : (
        <>
          {/* ── Podium (top 3) ─────────────────────────── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {top3.map((entry, i) => (
                <Link key={entry.id} href={`/profil/${entry.username}`}>
                  <div className={`
                    flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border bg-gradient-to-b transition-all
                    hover:scale-[1.02] cursor-pointer
                    ${PODIUM_COLORS[i]}
                  `}>
                    <div className="text-3xl sm:text-4xl mb-2">{MEDAL[i]}</div>
                    {(() => {
                      const t = getTier(entry.points)
                      return (
                        <div className={`p-0.5 rounded-full ring-2 mb-2 ${t.ringColor}`}>
                          <Avatar src={entry.avatar_url} username={entry.username} size="md" />
                        </div>
                      )
                    })()}
                    <p className="text-xs sm:text-sm font-bold text-fg truncate w-full">
                      {entry.display_name || entry.username}
                    </p>
                    {/* Tier badge */}
                    {(() => {
                      const t = getTier(entry.points)
                      return (
                        <span className={`text-xs font-bold ${t.color} mt-0.5`}>{t.emoji} {t.label}</span>
                      )
                    })()}
                    <p className={`font-black mt-2 text-sm sm:text-base ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : 'text-orange-400'
                    }`}>
                      {formatPoints(entry.points)}
                    </p>
                    <p className="text-xs text-fg-subtle">puan</p>
                    {entry.duel_count > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-fg-subtle">
                        <Swords size={9} />
                        %{Math.round((entry.win_count / entry.duel_count) * 100)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Rest of the list ───────────────────────── */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {rest.map((entry) => (
                <Link key={entry.id} href={`/profil/${entry.username}`}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-stroke hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      <span className="text-sm font-bold text-fg-subtle">#{entry.rank}</span>
                    </div>

                    {/* Avatar */}
                    <Avatar src={entry.avatar_url} username={entry.username} size="sm" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm truncate transition-colors ${entry.is_me ? 'text-purple-300' : 'text-fg group-hover:text-purple-300'}`}>
                          {entry.display_name || entry.username}
                          {entry.is_me && <span className="ml-1 text-xs text-purple-400 font-normal">(sen)</span>}
                        </p>
                        {(() => {
                          const t = getTier(entry.points)
                          return (
                            <span className={`text-xs font-bold ${t.color} shrink-0`}>{t.emoji} {t.label}</span>
                          )
                        })()}
                      </div>
                      <p className="text-xs text-fg-subtle">
                        @{entry.username}
                        {entry.active_title && <span className="ml-2 text-violet-400">· {entry.active_title}</span>}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-fg text-sm">{formatPoints(entry.points)}</p>
                      <p className="text-xs text-fg-subtle">puan</p>
                    </div>

                    {/* Win rate */}
                    <div className="text-right flex-shrink-0 hidden sm:block w-14">
                      <p className="text-sm font-bold text-green-400">
                        %{entry.duel_count > 0 ? Math.round((entry.win_count / entry.duel_count) * 100) : 0}
                      </p>
                      <p className="text-xs text-fg-subtle">kazanma</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My rank (sticky footer) ─────────────────── */}
      {myEntry && (
        <div className="mt-5 pt-4 border-t border-stroke">
          <p className="text-xs text-fg-subtle mb-2 text-center font-medium tracking-wide uppercase">
            Senin Sıralamanı
          </p>
          <Link href={`/profil/${myEntry.username}`}>
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/10 border border-purple-500/40 rounded-xl hover:border-purple-400/60 transition-all cursor-pointer">
              <div className="w-7 text-center flex-shrink-0">
                <span className="text-sm font-black text-purple-400">#{myEntry.rank}</span>
              </div>
              <Avatar src={myEntry.avatar_url} username={myEntry.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-fg text-sm truncate">{myEntry.display_name || myEntry.username}</p>
                <p className="text-xs text-fg-subtle">@{myEntry.username}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-purple-400">{formatPoints(myEntry.points)}</p>
                <p className="text-xs text-fg-subtle">puan</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
