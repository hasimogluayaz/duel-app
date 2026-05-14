'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Archive, ChevronRight, CheckCircle2, X, MessageCircle, Swords } from 'lucide-react'
import { ModeChip } from '@/components/ui/ModeChip'

interface Scenario {
  id: string
  content: string
  category: string
  active_date: string | null
  answer_count: number
  created_at: string
  is_user_created: boolean
  answered: boolean
  won?: boolean | null
  duel_count?: number
  winner_name?: string | null
  author?: { username: string; display_name: string; avatar_url: string | null } | null
}

interface Category {
  value: string
  label: string
}

interface Props {
  initialScenarios: Scenario[]
  categories: Category[]
  activeCategory: string
  activeSort: string
  activeFilter?: string
  userId: string | null
  totalCount?: number
  answeredCount?: number
  winCount?: number
}

const MONTH_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
const DAY_TR   = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']

function DateTile({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return <div style={{ width: 52, flexShrink: 0 }} />
  const d = new Date(dateStr)
  return (
    <div style={{
      width: 52, flexShrink: 0, textAlign: 'center',
      padding: '8px 4px', background: 'var(--surface-2, #f0f2f5)',
      borderRadius: 10,
    }}>
      <div style={{ font: '700 20px Geist Mono, monospace', color: 'var(--fg)', lineHeight: 1 }}>{d.getDate()}</div>
      <div style={{ font: '600 10px -apple-system, sans-serif', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>
        {MONTH_TR[d.getMonth()]}
      </div>
      <div style={{ font: '500 9.5px -apple-system, sans-serif', color: 'var(--fg-subtle)', marginTop: 2 }}>
        {DAY_TR[d.getDay()]}
      </div>
    </div>
  )
}

export default function ArsivClient({
  initialScenarios,
  categories,
  activeCategory,
  activeSort,
  activeFilter = 'all',
  userId,
  totalCount = 0,
  answeredCount: initialAnswered = 0,
  winCount = 0,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [scenarios, setScenarios] = useState(initialScenarios)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialScenarios.length === 24 ? initialScenarios[initialScenarios.length - 1]?.created_at : null
  )

  const answeredCount = scenarios.filter(s => s.answered).length

  function navigate(params: Record<string, string>) {
    const url = new URL(pathname, window.location.origin)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    router.push(url.pathname + url.search)
  }

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ cursor: nextCursor, limit: '24' })
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (activeSort !== 'recent') params.set('sort', activeSort)
      const res = await fetch(`/api/scenarios?${params}`)
      const data = await res.json()
      setScenarios(prev => [...prev, ...data.scenarios])
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [nextCursor, loading, activeCategory, activeSort])

  const FILTERS = [
    { id: 'all',        label: 'Tümü' },
    { id: 'answered',   label: 'Cevapladıklarım' },
    { id: 'won',        label: 'Kazandıklarım',    color: 'var(--k-success, #16a34a)' },
    { id: 'lost',       label: 'Kaybettiklerim',   color: 'var(--k-danger, #dc2626)' },
    { id: 'unanswered', label: 'Cevapsız' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="max-w-3xl mx-auto px-4 py-6">

      {/* ── Blue hero ── */}
      <div style={{
        padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        background: 'linear-gradient(135deg, #1442a8, #2a6cf0)',
        color: '#fff', borderRadius: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Archive size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <h1 style={{ margin: 0, font: '700 22px/1.1 -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em' }}>
            Senaryo Arşivi
          </h1>
          <p style={{ margin: '4px 0 0', font: '400 13.5px -apple-system, sans-serif', opacity: 0.88 }}>
            Geçmiş günlerin senaryolarını oku, cevap ver, puan topla.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 22, padding: '4px 8px', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 22px Geist Mono, monospace' }}>{totalCount || scenarios.length}</div>
            <div style={{ font: '500 11px -apple-system, sans-serif', opacity: .88, textTransform: 'uppercase', letterSpacing: '.04em' }}>Toplam</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 22px Geist Mono, monospace' }}>{answeredCount}</div>
            <div style={{ font: '500 11px -apple-system, sans-serif', opacity: .88, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cevapladığın</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 22px Geist Mono, monospace', color: '#bff5d5' }}>{winCount}</div>
            <div style={{ font: '500 11px -apple-system, sans-serif', opacity: .88, textTransform: 'uppercase', letterSpacing: '.04em' }}>Galibiyet</div>
          </div>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => navigate({ category: activeCategory, sort: activeSort, filter: f.id })}
            style={{
              padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${activeFilter === f.id ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
              background: activeFilter === f.id ? 'var(--fg, #0f1320)' : 'var(--surface, #fff)',
              color: activeFilter === f.id ? '#fff' : (f.color || 'var(--fg-muted)'),
              font: '500 13px -apple-system, sans-serif',
            }}
          >{f.label}</button>
        ))}

        {/* Category + sort inline */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['recent', 'popular'] as const).map(s => (
            <button key={s}
              onClick={() => navigate({ category: activeCategory, sort: s, filter: activeFilter })}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: `1px solid ${activeSort === s ? 'transparent' : 'var(--stroke)'}`,
                background: activeSort === s ? 'var(--k-blue-500, #2a6cf0)' : 'var(--surface)',
                color: activeSort === s ? '#fff' : 'var(--fg-muted)',
                font: '500 12px -apple-system, sans-serif', cursor: 'pointer',
              }}
            >{s === 'recent' ? '🕐 Yeni' : '🔥 Popüler'}</button>
          ))}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {categories.map(cat => (
          <button key={cat.value}
            onClick={() => navigate({ category: cat.value, sort: activeSort, filter: activeFilter })}
            style={{
              padding: '7px 12px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
              border: `1px solid ${activeCategory === cat.value ? 'transparent' : 'var(--stroke)'}`,
              background: activeCategory === cat.value ? 'var(--fg)' : 'var(--surface)',
              color: activeCategory === cat.value ? '#fff' : 'var(--fg-muted)',
              font: '500 12px -apple-system, sans-serif', cursor: 'pointer',
            }}
          >{cat.label}</button>
        ))}
      </div>

      {/* ── Scenarios list ── */}
      {scenarios.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--stroke)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
          <p style={{ margin: 0, font: '600 15px -apple-system, sans-serif', color: 'var(--fg)' }}>
            Bu kategoride henüz senaryo yok
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--stroke)',
          borderRadius: 18, overflow: 'hidden',
        }}>
          {scenarios.map((s, i) => (
            <Link key={s.id} href={`/arsiv/${s.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', gap: 14, padding: '16px 18px',
                borderBottom: i === scenarios.length - 1 ? 'none' : '1px solid var(--stroke)',
                cursor: 'pointer', alignItems: 'flex-start',
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2, #f7f8fa)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <DateTile dateStr={s.active_date || s.created_at} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <ModeChip mode={s.is_user_created ? 'senaryo' : 'senaryo'} />
                    {s.won === true && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        font: '600 11px -apple-system, sans-serif', color: 'var(--k-success, #16a34a)',
                        padding: '2px 8px', borderRadius: 99,
                        background: 'var(--k-success-50, #ecfdf3)',
                      }}>
                        <CheckCircle2 size={11} /> Kazandın
                      </span>
                    )}
                    {s.won === false && s.answered && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        font: '600 11px -apple-system, sans-serif', color: 'var(--k-danger, #dc2626)',
                        padding: '2px 8px', borderRadius: 99,
                        background: '#fef2f2',
                      }}>
                        <X size={11} /> Kaybettin
                      </span>
                    )}
                    {s.answered && s.won == null && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        font: '600 11px -apple-system, sans-serif', color: 'var(--k-blue-500, #2a6cf0)',
                        padding: '2px 8px', borderRadius: 99,
                        background: 'var(--k-blue-50, #eef4ff)',
                      }}>
                        <CheckCircle2 size={11} /> Cevapladın
                      </span>
                    )}
                  </div>

                  <div style={{
                    font: '600 14.5px/1.4 -apple-system, sans-serif',
                    color: 'var(--fg)', marginBottom: 8,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {s.content}
                  </div>

                  <div style={{ display: 'flex', gap: 14, font: '500 12px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MessageCircle size={12} style={{ verticalAlign: '-1px' }} /> {s.answer_count.toLocaleString('tr-TR')}
                    </span>
                    {(s.duel_count ?? 0) > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Swords size={12} style={{ verticalAlign: '-1px' }} /> {s.duel_count}
                      </span>
                    )}
                    {s.winner_name && (
                      <span>🏆 {s.winner_name}</span>
                    )}
                  </div>
                </div>

                <ChevronRight size={18} style={{ color: 'var(--fg-subtle)', alignSelf: 'center', flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid var(--stroke)',
            background: 'var(--surface)',
            color: 'var(--k-blue-500, #2a6cf0)',
            font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Yükleniyor...' : 'Daha fazla göster'}
        </button>
      )}
    </div>
  )
}
