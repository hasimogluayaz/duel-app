'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import Link from 'next/link'
import { Search, Star, TrendingUp, Swords, MessageCircle, Plus, ChevronRight, X } from 'lucide-react'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import TrendingTags from '@/components/social/TrendingTags'
import { StoriesBar } from '@/components/feed/StoriesBar'
import { ModeChip } from '@/components/ui/ModeChip'

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'aile',    emoji: '👨‍👩‍👧', label: 'Aile',       count: '1.2k', color: '#2a6cf0' },
  { key: 'ask',     emoji: '❤️',   label: 'Aşk',        count: '3.2k', color: '#dc2626' },
  { key: 'is',      emoji: '💼',   label: 'İş Hayatı',  count: '940',  color: '#1442a8' },
  { key: 'etik',    emoji: '⚖️',   label: 'Etik',       count: '612',  color: '#1c2f6e' },
  { key: 'felsefe', emoji: '🤔',   label: 'Felsefe',    count: '480',  color: '#16a34a' },
  { key: 'dunya',   emoji: '🌍',   label: 'Gündem',     count: '1.4k', color: '#1f8df0' },
  { key: 'sosyal',  emoji: '👥',   label: 'Arkadaşlık', count: '860',  color: '#0e7490' },
  { key: 'mizah',   emoji: '😂',   label: 'Mizah',      count: '720',  color: '#7c3aed' },
]

// ─── Featured Scenario ────────────────────────────────────────────────────────
function FeaturedScenario() {
  const [scenario, setScenario] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios?editor_pick=true&limit=1')
      .then(r => r.json())
      .then(d => { setScenario(d.scenarios?.[0] ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ height: 110, borderRadius: 18, background: 'var(--surface-2)' }} className="animate-pulse" />
  )
  if (!scenario) return null

  return (
    <Link href={`/arsiv/${scenario.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: 18, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #1442a8 0%, #2a6cf0 60%, #4aa8ff 100%)',
        padding: '18px 20px', color: '#fff',
        boxShadow: '0 4px 24px rgba(42,108,240,.25)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -30, top: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative' }}>
          <Star size={10} style={{ fill: '#fcd34d', color: '#fcd34d' }} />
          <span style={{ font: '700 10px -apple-system, sans-serif', letterSpacing: '.07em', textTransform: 'uppercase', color: '#fcd34d' }}>
            Editör Seçimi
          </span>
        </div>
        <p style={{ margin: 0, font: '600 14.5px/1.45 -apple-system, sans-serif', color: '#fff', position: 'relative' }}>
          {scenario.content}
        </p>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, font: '500 12px -apple-system, sans-serif', color: 'rgba(255,255,255,.75)', position: 'relative' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageCircle size={11} /> {scenario.answer_count} cevap
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            Cevapla <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Rising Scenarios ─────────────────────────────────────────────────────────
function RisingScenarios() {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios?sort=popular&limit=8')
      .then(r => r.json())
      .then(d => { setScenarios(d.scenarios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: 'var(--surface-2)' }} className="animate-pulse" />)}
    </div>
  )

  if (scenarios.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--stroke)',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {scenarios.map((s, i) => (
        <Link key={s.id} href={`/arsiv/${s.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
            borderBottom: i === scenarios.length - 1 ? 'none' : '1px solid var(--stroke)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: '700 12px Geist Mono, monospace', color: 'var(--fg-subtle)',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ModeChip mode={s.is_user_created ? 'senaryo' : 'senaryo'} />
                {s.category && (
                  <span style={{ font: '500 11px -apple-system, sans-serif', color: 'var(--fg-subtle)', textTransform: 'capitalize' }}>
                    {s.category}
                  </span>
                )}
              </div>
              <p style={{
                margin: 0, font: '500 13.5px/1.4 -apple-system, sans-serif', color: 'var(--fg)',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {s.content}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 5, font: '500 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MessageCircle size={11} /> {s.answer_count?.toLocaleString('tr-TR') ?? 0}
                </span>
                {(s.duel_count ?? 0) > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Swords size={11} /> {s.duel_count}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0, alignSelf: 'center' }} />
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Search Results ───────────────────────────────────────────────────────────
function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const [results, setResults] = useState<{ users: any[]; scenarios: any[] }>({ users: [], scenarios: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) return
    const id = setTimeout(async () => {
      setLoading(true)
      const [usersRes, scenariosRes] = await Promise.all([
        fetch(`/api/search/users?q=${encodeURIComponent(query)}`).then(r => r.json()),
        fetch(`/api/search?type=scenarios&q=${encodeURIComponent(query)}`).then(r => r.json()),
      ])
      setResults({ users: usersRes.users ?? [], scenarios: scenariosRes.scenarios ?? [] })
      setLoading(false)
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  if (query.length < 2) return null

  if (loading) return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <Spinner size="md" />
    </div>
  )

  const hasResults = results.users.length > 0 || results.scenarios.length > 0

  if (!hasResults) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ font: '500 14px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>"{query}" için sonuç bulunamadı</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {results.users.length > 0 && (
        <div>
          <p style={{ font: '700 11px -apple-system, sans-serif', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            Kullanıcılar
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--stroke)', borderRadius: 14, overflow: 'hidden' }}>
            {results.users.map((user, i) => (
              <Link key={user.id} href={`/profil/${user.username}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderBottom: i === results.users.length - 1 ? 'none' : '1px solid var(--stroke)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar src={user.avatar_url} username={user.username} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, font: '600 14px -apple-system, sans-serif', color: 'var(--fg)' }}>
                      {user.display_name || user.username}
                    </p>
                    <p style={{ margin: '2px 0 0', font: '400 12px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>
                      @{user.username}
                    </p>
                  </div>
                  <Star size={12} style={{ color: '#f59e0b' }} />
                  <span style={{ font: '600 12px Geist Mono, monospace', color: 'var(--fg-muted)' }}>
                    {user.total_points?.toLocaleString('tr-TR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {results.scenarios.length > 0 && (
        <div>
          <p style={{ font: '700 11px -apple-system, sans-serif', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            Senaryolar
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--stroke)', borderRadius: 14, overflow: 'hidden' }}>
            {results.scenarios.map((s, i) => (
              <Link key={s.id} href={`/arsiv/${s.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: i === results.scenarios.length - 1 ? 'none' : '1px solid var(--stroke)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <p style={{ margin: '0 0 4px', font: '500 13.5px/1.4 -apple-system, sans-serif', color: 'var(--fg)' }}>
                    {s.content}
                  </p>
                  <p style={{ margin: 0, font: '500 11.5px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>
                    {s.answer_count ?? 0} cevap{s.category ? ` · ${s.category}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Category Results ─────────────────────────────────────────────────────────
function CategoryResults({ category, onClose }: { category: typeof CATEGORIES[0]; onClose: () => void }) {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/scenarios?category=${category.key}&limit=8`)
      .then(r => r.json())
      .then(d => { setScenarios(d.scenarios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category.key])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{category.emoji}</span>
          <span style={{ font: '700 15px -apple-system, sans-serif', color: 'var(--fg)' }}>{category.label} Senaryoları</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 12, background: 'var(--surface-2)' }} className="animate-pulse" />)}
        </div>
      ) : scenarios.length === 0 ? (
        <p style={{ font: '400 13px -apple-system, sans-serif', color: 'var(--fg-subtle)', textAlign: 'center', padding: '20px 0' }}>
          Bu kategoride henüz senaryo yok
        </p>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--stroke)', borderRadius: 14, overflow: 'hidden' }}>
          {scenarios.map((s, i) => (
            <Link key={s.id} href={`/arsiv/${s.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderBottom: i === scenarios.length - 1 ? 'none' : '1px solid var(--stroke)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, font: '500 13.5px/1.4 -apple-system, sans-serif', color: 'var(--fg)',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{s.content}</p>
                  <p style={{ margin: '4px 0 0', font: '500 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>
                    {s.answer_count ?? 0} cevap
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <BookmarkButton type="scenario" id={s.id} size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KesfetPage() {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[0] | null>(null)

  const isSearching = search.length > 0

  return (
    <div className="max-w-2xl mx-auto">

      {/* Stories bar */}
      <StoriesBar />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 16px 32px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, font: '700 22px -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
              Keşfet
            </h1>
            <p style={{ margin: '2px 0 0', font: '400 13px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>
              Senaryolar, kullanıcılar ve kategoriler
            </p>
          </div>
          <Link
            href="/senaryo-olustur"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--k-blue-500, #2a6cf0)', color: '#fff',
              font: '600 13px -apple-system, sans-serif', textDecoration: 'none',
            }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Senaryo</span>
          </Link>
        </div>

        {/* ── Search bar ── */}
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--fg-subtle)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Senaryo, düello, kullanıcı ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 44, paddingLeft: 44, paddingRight: search ? 40 : 14,
              font: '400 14.5px -apple-system, sans-serif',
              border: '1px solid var(--stroke)', borderRadius: 999,
              background: 'var(--surface)', color: 'var(--fg)', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--k-blue-500, #2a6cf0)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--stroke)')}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 2,
            }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Search results ── */}
        {isSearching ? (
          <SearchResults query={search} onClose={() => setSearch('')} />
        ) : (
          <>
            {/* ── Featured scenario ── */}
            <FeaturedScenario />

            {/* ── Trending tags ── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--stroke)',
              borderRadius: 16, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp size={13} style={{ color: 'var(--k-blue-500, #2a6cf0)' }} />
                <span style={{ font: '700 11px -apple-system, sans-serif', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Gündemdekiler
                </span>
              </div>
              <TrendingTags />
            </div>

            {/* ── Kategoriler ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, font: '700 16px -apple-system, sans-serif', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                  Kategoriler
                </p>
                <Link href="/arsiv" style={{ font: '500 12.5px -apple-system, sans-serif', color: 'var(--k-blue-500, #2a6cf0)', textDecoration: 'none' }}>
                  Tümü →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCat?.key === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCat(isSelected ? null : cat)}
                      style={{
                        padding: 14, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        display: 'flex', flexDirection: 'column', gap: 6,
                        background: isSelected
                          ? `color-mix(in oklab, ${cat.color} 10%, var(--surface, white))`
                          : 'var(--surface, #fff)',
                        border: isSelected
                          ? `2px solid ${cat.color}`
                          : '1px solid var(--stroke, #e4e7ed)',
                        transition: 'border .12s, background .12s',
                      }}
                    >
                      <span style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `color-mix(in oklab, ${cat.color} 14%, var(--surface, white))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>{cat.emoji}</span>
                      <span style={{ font: '600 14px -apple-system, sans-serif', color: 'var(--fg)' }}>{cat.label}</span>
                      <span style={{ font: '500 11px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>{cat.count} senaryo</span>
                    </button>
                  )
                })}
              </div>

              {/* Category results inline */}
              {selectedCat && (
                <div style={{ marginTop: 16 }}>
                  <CategoryResults category={selectedCat} onClose={() => setSelectedCat(null)} />
                </div>
              )}
            </div>

            {/* ── Yükselen Senaryolar ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <TrendingUp size={14} style={{ color: 'var(--k-blue-500, #2a6cf0)' }} />
                <p style={{ margin: 0, font: '700 16px -apple-system, sans-serif', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                  Yükselen Senaryolar
                </p>
              </div>
              <RisingScenarios />
            </div>

          </>
        )}
      </div>
    </div>
  )
}
