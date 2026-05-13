'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import Link from 'next/link'

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time' | 'friends'

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
  rank_change?: number | null
  is_me?: boolean
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Bugün',
  weekly: 'Hafta',
  monthly: 'Ay',
  all_time: 'Tüm Zaman',
  friends: 'Arkadaşlar',
}

export default function LiderlikPage() {
  const [period, setPeriod] = useState<Period>('weekly')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [myEntry, setMyEntry] = useState<Entry | null>(null)

  useEffect(() => { loadLeaderboard() }, [period])

  async function loadLeaderboard() {
    setLoading(true)
    const res = await fetch(`/api/leaderboard?period=${period}`)
    const json = await res.json()
    setEntries(json.entries ?? [])
    setMyEntry(json.myEntry ?? null)
    setLoading(false)
  }

  const top3 = entries.slice(0, 3)

  return (
    <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Hero ── */}
      <div style={{
        margin: '16px 16px 0',
        background: 'linear-gradient(140deg, #0a1f55 0%, #1442a8 50%, #2a6cf0 100%)',
        color: '#fff',
        padding: '20px 22px 22px',
        borderRadius: 22,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--k-shadow-hero)',
      }}>
        {/* Trophy watermark */}
        <div aria-hidden style={{
          position: 'absolute', right: -40, top: -40,
          fontSize: 200, color: 'rgba(255,255,255,0.06)',
          letterSpacing: '-0.05em', userSelect: 'none', lineHeight: 1,
        }}>🏆</div>

        <div className="k3-eyebrow" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
          Bu hafta · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
        </div>
        <h1 className="k3-h-1" style={{ margin: '0 0 16px', fontSize: 42, color: '#fff' }}>
          Liderlik
        </h1>

        {/* Period pills */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 99,
                       background: 'rgba(255,255,255,0.1)', width: 'fit-content' }}>
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)} style={{
              padding: '7px 14px', borderRadius: 99, border: 'none',
              background: period === id ? '#fff' : 'transparent',
              color: period === id ? 'var(--k-blue-700)' : 'rgba(255,255,255,.8)',
              font: `${period === id ? 600 : 500} 12.5px 'Geist', sans-serif`,
              cursor: 'pointer', transition: 'background .12s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 mx-4 bg-surface border border-stroke rounded-3xl">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-fg font-semibold">Henüz sıralama yok</p>
          <p className="text-fg-subtle text-sm mt-1">Düelloya gir ve sıralamada yerini al!</p>
          <Link href="/oyun" className="inline-block mt-4 text-sm text-fg-muted hover:text-fg font-semibold transition-colors">
            Oynamaya başla →
          </Link>
        </div>
      ) : (
        <div className="px-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Podium ── */}
          {top3.length >= 3 && (
            <div className="hidden md:grid grid-cols-3 gap-3 py-4" style={{ alignItems: 'end' }}>
              {([1, 0, 2] as const).map((idx) => {
                const u = top3[idx]
                const place = idx + 1
                const heights  = [170, 130, 100] as const
                const medals   = ['🥇', '🥈', '🥉'] as const
                const gradients = [
                  'linear-gradient(180deg, #fcd34d, #d97706)',
                  'linear-gradient(180deg, #e5e7eb, #94a3b8)',
                  'linear-gradient(180deg, #fdba74, #b45309)',
                ] as const
                const rankColors = ['#d97706', '#6b7280', '#b45309'] as const
                return (
                  <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar
                        src={u.avatar_url}
                        username={u.username}
                        size={place === 1 ? 'xl' : 'lg'}
                      />
                      <span style={{
                        position: 'absolute', bottom: -4, right: -4,
                        fontSize: place === 1 ? 28 : 22,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.15))',
                      }}>{medals[idx]}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ font: `700 ${place === 1 ? 17 : 15}px 'Geist', sans-serif`, letterSpacing: '-0.01em' }}>
                        {u.display_name || u.username}
                      </div>
                      <div className="tab-nums" style={{ font: '500 12.5px Geist Mono, monospace', color: 'var(--fg-subtle)', marginTop: 2 }}>
                        {u.points.toLocaleString('tr-TR')} puan
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: heights[idx],
                      background: gradients[idx],
                      borderRadius: '14px 14px 0 0',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                      paddingTop: 12,
                      font: '900 36px Geist, sans-serif',
                      color: '#fff',
                      letterSpacing: '-0.04em',
                      boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.12)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>{place}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Table ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--stroke)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: 'var(--k-shadow-md)',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 60px 90px 90px 90px',
              padding: '12px 18px',
              borderBottom: '1px solid var(--stroke)',
              background: 'var(--surface-2)',
            }} className="hidden sm:grid" data-cols="6">
              <span className="k3-eyebrow">№</span>
              <span className="k3-eyebrow">Oyuncu</span>
              <span className="k3-eyebrow" style={{ textAlign: 'center' }}>±</span>
              <span className="k3-eyebrow" style={{ textAlign: 'right' }}>Düello</span>
              <span className="k3-eyebrow" style={{ textAlign: 'right' }}>Galip</span>
              <span className="k3-eyebrow" style={{ textAlign: 'right' }}>Puan</span>
            </div>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--stroke)', background: 'var(--surface-2)' }}
              className="grid sm:hidden grid-cols-[40px_1fr_90px]">
              <span className="k3-eyebrow">№</span>
              <span className="k3-eyebrow">Oyuncu</span>
              <span className="k3-eyebrow" style={{ textAlign: 'right' }}>Puan</span>
            </div>

            {entries.map((u, i) => {
              const isMe = u.is_me
              const rankColor =
                u.rank === 1 ? '#d97706' :
                u.rank === 2 ? '#6b7280' :
                u.rank === 3 ? '#b45309' :
                'var(--fg-subtle)'
              return (
                <Link key={u.id} href={`/profil/${u.username}`} style={{ textDecoration: 'none' }}>
                  {/* Mobile row */}
                  <div className="grid sm:hidden grid-cols-[40px_1fr_90px] items-center gap-2 py-3 px-4 hover:bg-surface-2 transition-colors"
                    style={{
                      borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--stroke)',
                      background: isMe ? 'var(--k-blue-50)' : 'transparent',
                    }}>
                    <span className="tab-nums" style={{
                      font: `${u.rank <= 3 ? 800 : 700} ${u.rank <= 3 ? 17 : 14}px 'Geist', sans-serif`,
                      color: rankColor, letterSpacing: '-0.02em',
                    }}>{u.rank}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar src={u.avatar_url} username={u.username} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ font: '600 14px Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg)' }}>
                            {u.display_name || u.username}
                          </span>
                          {isMe && (
                            <span className="tab-nums" style={{
                              background: 'var(--k-blue-500)', color: '#fff',
                              font: '800 10px Geist, sans-serif',
                              padding: '1px 8px', borderRadius: 999, height: 18,
                              display: 'inline-flex', alignItems: 'center',
                            }}>SEN</span>
                          )}
                        </div>
                        <div style={{ font: '400 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>@{u.username}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tab-nums" style={{ font: '700 14px Geist Mono, monospace', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                        {formatPoints(u.points)}
                      </div>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[50px_1fr_60px_90px_90px_90px] items-center gap-2 py-3.5 px-5 hover:bg-surface-2 transition-colors"
                    style={{
                      borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--stroke)',
                      background: isMe ? 'var(--k-blue-50)' : 'transparent',
                    }}>
                    <span className="tab-nums" style={{
                      font: `${u.rank <= 3 ? 800 : 700} ${u.rank <= 3 ? 17 : 14}px 'Geist', sans-serif`,
                      color: rankColor, letterSpacing: '-0.02em',
                    }}>{u.rank}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar src={u.avatar_url} username={u.username} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ font: '600 14px Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg)' }}>
                            {u.display_name || u.username}
                          </span>
                          {isMe && (
                            <span className="tab-nums" style={{
                              background: 'var(--k-blue-500)', color: '#fff',
                              font: '800 10px Geist, sans-serif',
                              padding: '1px 8px', borderRadius: 999, height: 18,
                              display: 'inline-flex', alignItems: 'center',
                            }}>SEN</span>
                          )}
                          {u.active_title && (
                            <span style={{ font: '500 11px Geist, sans-serif', color: 'var(--k-blue-500)' }}>
                              · {u.active_title}
                            </span>
                          )}
                        </div>
                        <div style={{ font: '400 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>@{u.username}</div>
                      </div>
                    </div>
                    {/* Rank change */}
                    <div style={{ textAlign: 'center' }}>
                      {u.rank_change != null && u.rank_change !== 0 ? (
                        <span className="tab-nums" style={{
                          font: '700 11px Geist Mono, monospace',
                          color: u.rank_change > 0 ? '#16a34a' : '#dc2626',
                          display: 'inline-flex', alignItems: 'center', gap: 1,
                        }}>
                          {u.rank_change > 0 ? '▲' : '▼'}{Math.abs(u.rank_change)}
                        </span>
                      ) : (
                        <span style={{ font: '500 11px monospace', color: 'var(--fg-subtle)' }}>—</span>
                      )}
                    </div>
                    <span className="tab-nums" style={{ textAlign: 'right', font: '500 13px Geist Mono, monospace', color: 'var(--fg-muted)' }}>
                      {u.duel_count}
                    </span>
                    <span className="tab-nums" style={{ textAlign: 'right', font: '600 13px Geist Mono, monospace', color: 'var(--k-success, #16a34a)' }}>
                      {u.win_count}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tab-nums" style={{ font: '700 15px Geist, sans-serif', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                        {formatPoints(u.points)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* ── My rank (if not in list) ── */}
          {myEntry && !myEntry.is_me && (
            <div style={{ paddingTop: 4 }}>
              <p className="k3-eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>
                Senin Sıralamanı
              </p>
              <Link href={`/profil/${myEntry.username}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  border: '1px solid var(--k-blue-200)', background: 'var(--k-blue-50)',
                  borderRadius: 14, cursor: 'pointer',
                }}>
                  <span className="tab-nums" style={{ width: 28, textAlign: 'center', font: '700 14px Geist Mono, monospace', color: 'var(--k-blue-500)' }}>
                    #{myEntry.rank}
                  </span>
                  <Avatar src={myEntry.avatar_url} username={myEntry.username} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 14px Geist, sans-serif', color: 'var(--fg)' }}>
                      {myEntry.display_name || myEntry.username}
                    </div>
                    <div style={{ font: '400 12px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>@{myEntry.username}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tab-nums" style={{ font: '700 14px Geist Mono, monospace', color: 'var(--k-blue-500)' }}>
                      {formatPoints(myEntry.points)}
                    </div>
                    <div style={{ font: '400 11px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>puan</div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      )}
    </div>
  )
}
