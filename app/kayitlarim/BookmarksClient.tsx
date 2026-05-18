'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, MessageSquare, Layers, Swords, Plus, ArrowUp, Filter } from 'lucide-react'
import { ModeChip } from '@/components/ui/ModeChip'

type TabType = 'all' | 'answers' | 'scenarios' | 'duels' | 'readlater'

interface AnswerBookmark {
  id: string
  created_at: string
  answer: {
    id: string
    content: string
    vote_count: number
    scenario: { id: string; content: string; category: string } | null
    user: { username: string; display_name: string | null } | null
  } | null
}

interface ScenarioBookmark {
  id: string
  created_at: string
  scenario: {
    id: string
    content: string
    category: string
    answer_count: number
  } | null
}

export default function BookmarksClient() {
  const [tab, setTab] = useState<TabType>('all')
  const [answers, setAnswers] = useState<AnswerBookmark[]>([])
  const [scenarios, setScenarios] = useState<ScenarioBookmark[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set())

  const load = async (type: 'answers' | 'scenarios') => {
    if (loadedTabs.has(type)) return
    setLoading(true)
    const res = await fetch(`/api/bookmarks?type=${type}`)
    const d = await res.json()
    if (type === 'answers') setAnswers(d.bookmarks ?? [])
    else setScenarios(d.bookmarks ?? [])
    setLoadedTabs(prev => new Set([...Array.from(prev), type]))
    setLoading(false)
  }

  useEffect(() => {
    load('answers')
    load('scenarios')
  }, [])

  const switchTab = (t: TabType) => {
    setTab(t)
    if (t === 'answers') load('answers')
    if (t === 'scenarios') load('scenarios')
    if (t === 'all') { load('answers'); load('scenarios') }
  }

  const removeAnswerBookmark = async (id: string, answerId: string) => {
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'answer', id: answerId }),
    })
    setAnswers(prev => prev.filter(b => b.id !== id))
  }

  const removeScenarioBookmark = async (id: string, scenarioId: string) => {
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'scenario', id: scenarioId }),
    })
    setScenarios(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, font: '700 22px -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
            Kaydettiklerim
          </h1>
          <p style={{ margin: '2px 0 0', font: '400 13px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>
            Sonra okumak için kaydettiğin senaryolar ve cevaplar.
          </p>
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', height: 36, borderRadius: 999,
          border: '1px solid var(--stroke, #e4e7ed)',
          background: 'var(--surface, #fff)',
          color: 'var(--fg-muted)',
          font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
        }}>
          <Filter size={14} /> Filtrele
        </button>
      </div>

      {/* ── Collection tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Favorilerim', icon: <MessageSquare size={18} />, color: 'var(--k-blue-500, #2a6cf0)', n: answers.length + scenarios.length, type: 'all' as TabType },
          { label: 'Senaryolar', icon: <Layers size={18} />, color: 'var(--k-navy-500, #1c2f6e)', n: scenarios.length, type: 'scenarios' as TabType },
          { label: 'Düello havuzu', icon: <Swords size={18} />, color: 'var(--k-sky-500, #1f8df0)', n: 0, type: 'duels' as TabType, dashed: false },
          { label: 'Yeni koleksiyon', icon: <Plus size={18} />, color: 'var(--k-text-3, #8e96a6)', n: null, type: null as TabType | null, dashed: true },
        ].map((col, i) => (
          <button key={i}
            onClick={() => col.type && switchTab(col.type)}
            style={{
              padding: 14, borderRadius: 14,
              background: col.type === tab ? `color-mix(in oklab, ${col.color} 8%, white)` : 'var(--surface, #fff)',
              textAlign: 'left', cursor: col.type ? 'pointer' : 'default',
              border: (col as any).dashed
                ? '1.5px dashed var(--stroke, #d6dae3)'
                : col.type === tab
                  ? `2px solid ${col.color}`
                  : '1px solid var(--stroke, #e4e7ed)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: `color-mix(in oklab, ${col.color} 14%, white)`,
              color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{col.icon}</span>
            <span style={{ font: '600 13.5px -apple-system, sans-serif', color: 'var(--fg)' }}>{col.label}</span>
            {col.n !== null && (
              <span style={{ font: '500 11.5px monospace', color: 'var(--fg-subtle)' }}>{col.n} öge</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab pills ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {([
          { id: 'all' as TabType, label: 'Tümü', count: answers.length + scenarios.length },
          { id: 'answers' as TabType, label: 'Cevaplar', count: answers.length },
          { id: 'scenarios' as TabType, label: 'Senaryolar', count: scenarios.length },
          { id: 'duels' as TabType, label: 'Düellolar', count: 0 },
          { id: 'readlater' as TabType, label: 'Sonra Oku', count: 0 },
        ]).map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
            border: `1px solid ${tab === t.id ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
            background: tab === t.id ? 'var(--fg, #0f1320)' : 'var(--surface, #fff)',
            color: tab === t.id ? '#fff' : 'var(--fg-muted)',
            font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
          }}>
            {t.label}
            <span style={{ font: '500 11px monospace', color: tab === t.id ? 'rgba(255,255,255,.7)' : 'var(--fg-subtle)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 88, borderRadius: 14, background: 'var(--surface-2, #f0f2f5)' }} />
          ))}
        </div>
      ) : (tab === 'duels') ? (
        <EmptyState text="Kaydedilmiş düello yok" icon={<Swords size={28} />} cta={{ label: 'Düello Başlat', href: '/' }} />
      ) : (tab === 'readlater') ? (
        <EmptyState text="Sonra okunacak içerik yok" icon={<Layers size={28} />} cta={{ label: 'Senaryolara Bak', href: '/arsiv' }} />
      ) : (tab === 'all') ? (
        answers.length === 0 && scenarios.length === 0 ? (
          <EmptyState text="Henüz hiçbir şey kaydetmedin" icon={<Bookmark size={28} />} cta={{ label: 'Senaryolara Göz At', href: '/arsiv' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {answers.slice(0, 5).map((b) => b.answer && (
              <div key={b.id} style={{
                background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
                borderRadius: 14, padding: 16,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--k-blue-100, #dbe7ff)', color: 'var(--k-blue-600, #1a56d6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 14px -apple-system, sans-serif',
                }}>
                  {(b.answer.user?.display_name || b.answer.user?.username || '?')[0].toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <ModeChip mode="senaryo" />
                    <span style={{ font: '500 11px monospace', color: 'var(--fg-subtle)' }}>Cevap</span>
                  </div>
                  {b.answer.scenario && (
                    <Link href={`/arsiv/${b.answer.scenario.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ font: '500 13px/1.4 -apple-system, sans-serif', color: 'var(--fg-muted)', marginBottom: 4 }}>
                        {b.answer.scenario.content}
                      </div>
                    </Link>
                  )}
                  <div style={{ font: '400 14px/1.5 -apple-system, sans-serif', color: 'var(--fg)' }}>
                    {b.answer.content}
                  </div>
                </div>
                <button onClick={() => removeAnswerBookmark(b.id, b.answer!.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--k-blue-500)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Bookmark size={18} fill="currentColor" />
                </button>
              </div>
            ))}
            {scenarios.slice(0, 5).map((b) => b.scenario && (
              <div key={b.id} style={{
                background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
                borderRadius: 14, padding: 16,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--k-navy-100, #ccd5ea)', color: 'var(--k-navy-600, #122351)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14px sans-serif',
                }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <ModeChip mode="senaryo" />
                  </div>
                  <Link href={`/arsiv/${b.scenario.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ font: '600 14px/1.4 -apple-system, sans-serif', color: 'var(--fg)' }}>
                      {b.scenario.content}
                    </div>
                  </Link>
                </div>
                <button onClick={() => removeScenarioBookmark(b.id, b.scenario!.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--k-blue-500)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Bookmark size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : tab === 'answers' ? (
        answers.length === 0 ? (
          <EmptyState text="Kaydedilmiş cevap yok" icon={<MessageSquare size={28} />} />
        ) : (
          <div style={{
            background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {answers.map((b, i) => b.answer && (
              <div key={b.id} style={{
                display: 'flex', gap: 12, padding: 16,
                borderBottom: i === answers.length - 1 ? 'none' : '1px solid var(--stroke, #e4e7ed)',
                cursor: 'pointer', alignItems: 'flex-start',
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--k-blue-100, #dbe7ff)',
                  color: 'var(--k-blue-600, #1a56d6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 14px -apple-system, sans-serif',
                }}>
                  {(b.answer.user?.display_name || b.answer.user?.username || '?')[0].toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <ModeChip mode="senaryo" />
                    <span style={{ font: '500 12px monospace', color: 'var(--fg-subtle)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MessageSquare size={11} /> Cevap
                    </span>
                    {b.answer.user && (
                      <Link href={`/profil/${b.answer.user.username}`} style={{ font: '500 12px -apple-system, sans-serif', color: 'var(--fg)', textDecoration: 'none' }}>
                        {b.answer.user.display_name || b.answer.user.username}
                      </Link>
                    )}
                  </div>
                  {b.answer.scenario && (
                    <Link href={`/arsiv/${b.answer.scenario.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ font: '500 13.5px/1.4 -apple-system, sans-serif', color: 'var(--fg-muted)', marginBottom: 6 }}>
                        {b.answer.scenario.content}
                      </div>
                    </Link>
                  )}
                  <div style={{ font: '400 14px/1.5 -apple-system, sans-serif', color: 'var(--fg)' }}>
                    {b.answer.content}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 12, font: '500 12px monospace', color: 'var(--fg-subtle)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <ArrowUp size={12} style={{ color: '#16a34a' }} /> {b.answer.vote_count}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeAnswerBookmark(b.id, b.answer!.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--k-blue-500, #2a6cf0)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                  title="Kayıttan kaldır"
                >
                  <Bookmark size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        scenarios.length === 0 ? (
          <EmptyState text="Kaydedilmiş senaryo yok" icon={<Layers size={28} />} />
        ) : (
          <div style={{
            background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {scenarios.map((b, i) => b.scenario && (
              <div key={b.id} style={{
                display: 'flex', gap: 12, padding: 16,
                borderBottom: i === scenarios.length - 1 ? 'none' : '1px solid var(--stroke, #e4e7ed)',
                cursor: 'pointer', alignItems: 'flex-start',
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--k-navy-100, #ccd5ea)', color: 'var(--k-navy-600, #122351)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 14px -apple-system, sans-serif',
                }}>
                  📄
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <ModeChip mode="senaryo" />
                    <span style={{ font: '500 11px monospace', color: 'var(--fg-subtle)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={11} /> Senaryo
                    </span>
                  </div>
                  <Link href={`/arsiv/${b.scenario.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ font: '600 14px/1.4 -apple-system, sans-serif', color: 'var(--fg)' }}>
                      {b.scenario.content}
                    </div>
                  </Link>
                  <div style={{ marginTop: 8, font: '500 12px monospace', color: 'var(--fg-subtle)', display: 'flex', gap: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MessageSquare size={11} /> {b.scenario.answer_count}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeScenarioBookmark(b.id, b.scenario!.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--k-blue-500, #2a6cf0)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                  title="Kayıttan kaldır"
                >
                  <Bookmark size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function EmptyState({ text, icon, cta }: { text: string; icon: React.ReactNode; cta?: { label: string; href: string } }) {
  return (
    <div style={{
      background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
      borderRadius: 14, padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{ color: 'var(--fg-subtle)', opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        {icon}
      </div>
      <p style={{ margin: 0, font: '600 15px -apple-system, sans-serif', color: 'var(--fg)' }}>{text}</p>
      {cta && (
        <Link href={cta.href} style={{
          display: 'inline-block', marginTop: 14, padding: '8px 18px', borderRadius: 999,
          background: 'var(--k-blue-500, #2a6cf0)', color: '#fff',
          font: '600 13px -apple-system, sans-serif', textDecoration: 'none',
        }}>{cta.label}</Link>
      )}
    </div>
  )
}
