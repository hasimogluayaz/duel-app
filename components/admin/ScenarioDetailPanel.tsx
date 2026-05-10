'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { X, MessageSquare, Swords, Star, Trophy, Clock, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Answer {
  id: string
  content: string
  vote_count: number
  created_at: string
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
}

interface Duel {
  id: string
  share_token: string
  status: string
  created_at: string
  winner_id: string | null
  total_votes: number
  votesA: number
  votesB: number
  challenger: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
  challenged: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
  winner_profile: { id: string; username: string; display_name: string | null } | null
}

interface Stats {
  total_answers: number
  total_duels: number
  active_duels: number
  completed_duels: number
  total_votes: number
}

interface DetailData {
  scenario: { id: string; content: string; active_date: string }
  answers: Answer[]
  duels: Duel[]
  stats: Stats
}

interface Props {
  scenarioId: string
  onClose: () => void
}

export function ScenarioDetailPanel({ scenarioId, onClose }: Props) {
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'answers' | 'duels'>('answers')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/scenarios/${scenarioId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [scenarioId])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-bg border border-stroke rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stroke shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary/70" />
            <h2 className="font-black text-fg">Senaryo Detayı</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-fg-subtle">Veri yüklenemedi.</div>
        ) : (
          <div className="flex flex-col overflow-hidden flex-1">

            {/* Scenario text */}
            <div className="px-5 py-4 bg-surface/50 border-b border-stroke shrink-0">
              <p className="text-sm text-fg-subtle mb-1">{data.scenario.active_date}</p>
              <p className="text-base font-semibold text-fg leading-relaxed">{data.scenario.content}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-5 gap-0 border-b border-stroke shrink-0">
              {[
                { icon: Users, label: 'Katılımcı', value: data.stats.total_answers, color: 'text-blue-400' },
                { icon: Swords, label: 'Düello', value: data.stats.total_duels, color: 'text-primary/70' },
                { icon: Clock, label: 'Aktif', value: data.stats.active_duels, color: 'text-amber-400' },
                { icon: Trophy, label: 'Tamamlandı', value: data.stats.completed_duels, color: 'text-green-400' },
                { icon: Star, label: 'Toplam Oy', value: data.stats.total_votes, color: 'text-secondary/70' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center py-3 border-r border-stroke last:border-r-0">
                  <Icon size={14} className={`${color} mx-auto mb-1`} />
                  <p className="text-lg font-black text-fg">{value}</p>
                  <p className="text-[10px] text-fg-subtle">{label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stroke shrink-0">
              <button
                onClick={() => setTab('answers')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'answers'
                    ? 'text-primary/70 border-b-2 border-primary/70'
                    : 'text-fg-subtle hover:text-fg'
                }`}
              >
                <MessageSquare size={14} />
                Cevaplar ({data.answers.length})
              </button>
              <button
                onClick={() => setTab('duels')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'duels'
                    ? 'text-primary/70 border-b-2 border-primary/70'
                    : 'text-fg-subtle hover:text-fg'
                }`}
              >
                <Swords size={14} />
                Düellolar ({data.duels.length})
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">

              {/* Answers tab */}
              {tab === 'answers' && (
                <div className="p-4 flex flex-col gap-2">
                  {data.answers.length === 0 ? (
                    <p className="text-center text-fg-subtle py-8 text-sm">Henüz cevap yok.</p>
                  ) : data.answers.map((a, i) => (
                    <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-stroke hover:border-stroke/80 transition-colors">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-fg-subtle">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Avatar src={a.user?.avatar_url} username={a.user?.username ?? '?'} size="xs" />
                          <Link href={`/profil/${a.user?.username}`} className="text-xs font-semibold text-fg hover:text-primary/70 transition-colors">
                            {a.user?.display_name || a.user?.username || '?'}
                          </Link>
                          {a.vote_count > 0 && (
                            <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-bold">
                              <Star size={9} className="fill-amber-400" />
                              {a.vote_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-fg-muted leading-relaxed">{a.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Duels tab */}
              {tab === 'duels' && (
                <div className="p-4 flex flex-col gap-2">
                  {data.duels.length === 0 ? (
                    <p className="text-center text-fg-subtle py-8 text-sm">Henüz düello yok.</p>
                  ) : data.duels.map(d => {
                    const totalV = d.votesA + d.votesB
                    const pctA = totalV > 0 ? Math.round((d.votesA / totalV) * 100) : 50
                    return (
                      <div key={d.id} className="p-3.5 rounded-xl bg-surface border border-stroke">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {d.status === 'completed' && <Badge variant="success" className="text-xs">Tamamlandı</Badge>}
                            {d.status === 'active'    && <Badge variant="info"    className="text-xs">⚡ Aktif</Badge>}
                            {d.status === 'pending'   && <Badge variant="warning" className="text-xs">⏳ Bekliyor</Badge>}
                            <span className="text-xs text-fg-subtle">{d.total_votes} oy</span>
                          </div>
                          <Link href={`/duel/${d.share_token}`} className="text-xs text-primary/70 hover:underline">
                            Görüntüle →
                          </Link>
                        </div>

                        {/* Players */}
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-2 flex-1 ${d.winner_id === d.challenger?.id ? 'font-bold' : ''}`}>
                            <Avatar src={d.challenger?.avatar_url} username={d.challenger?.username ?? '?'} size="xs" />
                            <span className="text-xs text-fg truncate">
                              {d.challenger?.display_name || d.challenger?.username}
                              {d.winner_id === d.challenger?.id && ' 🏆'}
                            </span>
                          </div>

                          {/* Vote bar */}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="w-24 h-1.5 rounded-full overflow-hidden flex bg-stroke">
                              <div className="bg-primary transition-all" style={{ width: `${pctA}%` }} />
                              <div className="bg-secondary transition-all" style={{ width: `${100 - pctA}%` }} />
                            </div>
                            <span className="text-[10px] text-fg-subtle">{pctA}% — {100 - pctA}%</span>
                          </div>

                          <div className={`flex items-center gap-2 flex-1 justify-end ${d.winner_id === d.challenged?.id ? 'font-bold' : ''}`}>
                            <span className="text-xs text-fg truncate text-right">
                              {d.winner_id === d.challenged?.id && '🏆 '}
                              {d.challenged?.display_name || d.challenged?.username}
                            </span>
                            <Avatar src={d.challenged?.avatar_url} username={d.challenged?.username ?? '?'} size="xs" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
