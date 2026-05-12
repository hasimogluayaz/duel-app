'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
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
  const rest = entries.slice(3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Gradient hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #5188fa, #1c2f6e)',
        color: '#fff',
        padding: '20px 22px',
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={24} />
          <h1 style={{ margin: 0, font: '700 22px/1.1 -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em' }}>
            Liderlik
          </h1>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.9 }}>
          En çok oy alan, en çok düello kazanan oyuncular.
        </p>
        {/* Period pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)} style={{
              padding: '6px 12px', borderRadius: 999, border: 'none',
              background: period === id ? '#fff' : 'rgba(255,255,255,0.18)',
              color: period === id ? 'var(--k-navy-600, #122351)' : '#fff',
              font: `${period === id ? 600 : 500} 12.5px -apple-system, sans-serif`,
              cursor: 'pointer', transition: 'background .12s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
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
          {/* ── Desktop podium ── */}
          {top3.length >= 3 && (
            <div className="hidden md:grid grid-cols-3 gap-4" style={{
              background: 'var(--surface, #fff)',
              border: '1px solid var(--stroke, #e4e7ed)',
              borderRadius: 14,
              padding: 20,
              alignItems: 'end',
            }}>
              {([1, 0, 2] as const).map((idx) => {
                const u = top3[idx]
                const t = getTier(u.points)
                const podiumH = [120, 150, 100][idx]
                const podiumC = ['#cbd5e1', '#fbbf24', '#f97316'][idx]
                return (
                  <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar src={u.avatar_url} username={u.username} size="lg" />
                    </div>
                    <div style={{ font: '600 14px -apple-system, sans-serif', textAlign: 'center' }}>
                      {u.display_name || u.username}
                    </div>
                    <div style={{ font: '500 12px monospace', color: 'var(--k-text-3, #8e96a6)' }}>
                      {formatPoints(u.points)} puan
                    </div>
                    <div style={{
                      width: '100%', height: podiumH,
                      background: podiumC,
                      borderRadius: '10px 10px 0 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: '800 32px -apple-system, sans-serif',
                      color: '#fff',
                    }}>{u.rank}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Ranked list ── */}
          <div style={{
            background: 'var(--surface, #fff)',
            border: '1px solid var(--stroke, #e4e7ed)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {entries.map((u, i) => {
              const t = getTier(u.points)
              const isMe = u.is_me
              return (
                <Link key={u.id} href={`/profil/${u.username}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--stroke, #e4e7ed)',
                    background: isMe ? 'var(--k-blue-50, #eef4ff)' : 'transparent',
                    cursor: 'pointer', transition: 'background .12s',
                  }}>
                    <span style={{
                      width: 28, textAlign: 'center',
                      font: `700 14px monospace`,
                      color: u.rank <= 3 ? 'var(--k-blue-500, #2a6cf0)' : 'var(--k-text-3, #8e96a6)',
                    }}>{u.rank}</span>
                    <Avatar src={u.avatar_url} username={u.username} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ font: '600 14px -apple-system, sans-serif', color: 'var(--fg, #0f1320)' }}>
                          {u.display_name || u.username}
                          {isMe && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--k-blue-500, #2a6cf0)', fontWeight: 400 }}>(sen)</span>}
                        </span>
                        <span className={`text-xs font-bold ${t.color} shrink-0`}>{t.emoji} {t.label}</span>
                      </div>
                      <div style={{ font: '400 12px monospace', color: 'var(--k-text-3, #8e96a6)' }}>
                        @{u.username}
                        {u.active_title && <span style={{ marginLeft: 8, color: 'var(--k-blue-500, #2a6cf0)' }}>· {u.active_title}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ font: '700 14px monospace', color: 'var(--fg, #0f1320)' }}>{formatPoints(u.points)}</div>
                      <div style={{ font: '400 11px monospace', color: 'var(--k-text-3, #8e96a6)' }}>puan</div>
                    </div>
                    {u.duel_count > 0 && (
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 52 }} className="hidden sm:block">
                        <div style={{ font: '600 13px monospace', color: '#16a34a' }}>
                          %{Math.round((u.win_count / u.duel_count) * 100)}
                        </div>
                        <div style={{ font: '400 11px monospace', color: 'var(--k-text-3, #8e96a6)' }}>kazanma</div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* ── My rank ── */}
          {myEntry && (
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--stroke, #e4e7ed)' }}>
              <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--k-text-3, #8e96a6)',
                           textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Senin Sıralamanı
              </p>
              <Link href={`/profil/${myEntry.username}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  border: '1px solid var(--k-blue-200, #b8cfff)',
                  background: 'var(--k-blue-50, #eef4ff)',
                  borderRadius: 12, cursor: 'pointer',
                }}>
                  <span style={{ width: 28, textAlign: 'center', font: '700 14px monospace', color: 'var(--k-blue-500, #2a6cf0)' }}>
                    #{myEntry.rank}
                  </span>
                  <Avatar src={myEntry.avatar_url} username={myEntry.username} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 14px -apple-system, sans-serif', color: 'var(--fg, #0f1320)' }}>
                      {myEntry.display_name || myEntry.username}
                    </div>
                    <div style={{ font: '400 12px monospace', color: 'var(--k-text-3, #8e96a6)' }}>@{myEntry.username}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ font: '700 14px monospace', color: 'var(--k-blue-500, #2a6cf0)' }}>{formatPoints(myEntry.points)}</div>
                    <div style={{ font: '400 11px monospace', color: 'var(--k-text-3, #8e96a6)' }}>puan</div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
