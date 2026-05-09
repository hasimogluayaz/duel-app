'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
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

const PODIUM_STYLES = [
  { rank: '#1', border: 'border-amber-500/30', text: 'text-amber-400' },
  { rank: '#2', border: 'border-stroke', text: 'text-fg-subtle' },
  { rank: '#3', border: 'border-stroke', text: 'text-fg-subtle' },
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-fg">Liderlik Tablosu</h1>
        <p className="text-sm text-fg-subtle mt-1">En iyi düellucular sıralanıyor</p>
      </div>

      {/* Period tabs */}
      <div className="flex border-b border-stroke mb-6 overflow-x-auto scrollbar-none">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
              period === p
                ? 'border-fg text-fg'
                : 'border-transparent text-fg-subtle hover:text-fg-muted hover:border-stroke'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={32} className="text-fg-subtle mx-auto mb-4 opacity-25" />
          <p className="text-fg font-semibold">Henüz sıralama yok</p>
          <p className="text-fg-subtle text-sm mt-1">Düelloya gir ve sıralamada yerini al!</p>
          <Link href="/oyun" className="inline-block mt-4 text-sm text-fg-muted hover:text-fg font-semibold transition-colors">
            Oynamaya başla →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Podium (top 3) ── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {top3.map((entry, i) => {
                const t = getTier(entry.points)
                const style = PODIUM_STYLES[i]
                return (
                  <Link key={entry.id} href={`/profil/${entry.username}`}>
                    <div className={`flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border bg-surface hover:bg-surface-2 transition-all ${style.border}`}>
                      {/* Rank badge */}
                      <div className={`text-sm font-black mb-2 ${style.text}`}>{style.rank}</div>
                      <div className={`p-0.5 rounded-full ring-2 mb-2 ${t.ringColor}`}>
                        <Avatar src={entry.avatar_url} username={entry.username} size="md" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-fg truncate w-full">
                        {entry.display_name || entry.username}
                      </p>
                      <span className={`text-xs font-bold ${t.color} mt-0.5`}>{t.emoji} {t.label}</span>
                      <p className={`font-black mt-2 text-sm sm:text-base ${style.text}`}>
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
                )
              })}
            </div>
          )}

          {/* ── Rest of the list ── */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {rest.map((entry) => {
                const t = getTier(entry.points)
                return (
                  <Link key={entry.id} href={`/profil/${entry.username}`}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-stroke hover:bg-surface-2 transition-all cursor-pointer group">
                      <div className="w-7 text-center flex-shrink-0">
                        <span className="text-sm font-bold text-fg-subtle">#{entry.rank}</span>
                      </div>
                      <Avatar src={entry.avatar_url} username={entry.username} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm truncate transition-colors ${entry.is_me ? 'text-purple-400' : 'text-fg'}`}>
                            {entry.display_name || entry.username}
                            {entry.is_me && <span className="ml-1 text-xs text-purple-400 font-normal">(sen)</span>}
                          </p>
                          <span className={`text-xs font-bold ${t.color} shrink-0`}>{t.emoji} {t.label}</span>
                        </div>
                        <p className="text-xs text-fg-subtle">
                          @{entry.username}
                          {entry.active_title && <span className="ml-2 text-violet-400">· {entry.active_title}</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-fg text-sm">{formatPoints(entry.points)}</p>
                        <p className="text-xs text-fg-subtle">puan</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block w-14">
                        <p className="text-sm font-bold text-green-400">
                          %{entry.duel_count > 0 ? Math.round((entry.win_count / entry.duel_count) * 100) : 0}
                        </p>
                        <p className="text-xs text-fg-subtle">kazanma</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── My rank ── */}
      {myEntry && (
        <div className="mt-5 pt-4 border-t border-stroke">
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2 text-center">
            Senin Sıralamanı
          </p>
          <Link href={`/profil/${myEntry.username}`}>
            <div className="flex items-center gap-3 px-4 py-3 border border-purple-500/30 bg-purple-500/5 rounded-xl hover:bg-purple-500/10 transition-all cursor-pointer">
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
