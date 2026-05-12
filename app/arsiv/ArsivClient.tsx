'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ScenarioCard from '@/components/scenarios/ScenarioCard'
import { Archive } from 'lucide-react'

interface Scenario {
  id: string
  content: string
  category: string
  active_date: string | null
  answer_count: number
  created_at: string
  is_user_created: boolean
  answered: boolean
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
}

export default function ArsivClient({
  initialScenarios,
  categories,
  activeCategory,
  activeSort,
  activeFilter = 'all',
  userId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [scenarios, setScenarios] = useState(initialScenarios)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialScenarios.length === 24 ? initialScenarios[initialScenarios.length - 1]?.created_at : null
  )
  const [showCreate, setShowCreate] = useState(false)

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
      setScenarios((prev) => [...prev, ...data.scenarios])
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [nextCursor, loading, activeCategory, activeSort])

  const answeredCount = scenarios.filter(s => s.answered).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="max-w-3xl mx-auto px-4 py-6">

      {/* ── Blue gradient hero ── */}
      <div style={{
        padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        background: 'linear-gradient(135deg, #1442a8, #2a6cf0)',
        color: '#fff', borderRadius: 20, border: 'none', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Archive size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <h1 style={{ margin: 0, font: '700 22px/1.1 -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em' }}>
            Senaryo Arşivi
          </h1>
          <p style={{ margin: '4px 0 0', font: '400 13.5px -apple-system, sans-serif', opacity: 0.88 }}>
            Geçmiş günlerin senaryolarını oku, cevap ver, puan topla.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 22, padding: '4px 8px', position: 'relative' }}>
          <div>
            <div style={{ font: '700 22px monospace' }}>{scenarios.length}</div>
            <div style={{ font: '500 11px -apple-system, sans-serif', opacity: 0.88, textTransform: 'uppercase', letterSpacing: '.04em' }}>Görüntülenen</div>
          </div>
          <div>
            <div style={{ font: '700 22px monospace' }}>{answeredCount}</div>
            <div style={{ font: '500 11px -apple-system, sans-serif', opacity: 0.88, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cevapladığın</div>
          </div>
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => navigate({ category: cat.value, sort: activeSort })}
              style={{
                padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap',
                border: `1px solid ${activeCategory === cat.value ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
                background: activeCategory === cat.value ? 'var(--fg, #0f1320)' : 'var(--surface, #fff)',
                color: activeCategory === cat.value ? '#fff' : 'var(--fg-muted)',
                font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort pills */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {(['recent', 'popular'] as const).map((s) => (
            <button
              key={s}
              onClick={() => navigate({ category: activeCategory, sort: s, filter: activeFilter })}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: `1px solid ${activeSort === s ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
                background: activeSort === s ? 'var(--k-blue-500, #2a6cf0)' : 'var(--surface, #fff)',
                color: activeSort === s ? '#fff' : 'var(--fg-muted)',
                font: '500 12px -apple-system, sans-serif', cursor: 'pointer',
              }}
            >
              {s === 'recent' ? '🕐 Yeni' : '🔥 Popüler'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Answer filter (logged in only) ── */}
      {userId && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            { v: 'all', label: 'Tümü' },
            { v: 'unanswered', label: '📭 Cevaplanmamış' },
            { v: 'answered', label: '✅ Cevapladım' },
          ] as const).map(f => (
            <button
              key={f.v}
              onClick={() => navigate({ category: activeCategory, sort: activeSort, filter: f.v })}
              style={{
                padding: '7px 12px', borderRadius: 999,
                border: `1px solid ${activeFilter === f.v ? 'var(--k-blue-200, #b8cfff)' : 'var(--stroke, #e4e7ed)'}`,
                background: activeFilter === f.v ? 'var(--k-blue-50, #eef4ff)' : 'var(--surface, #fff)',
                color: activeFilter === f.v ? 'var(--k-blue-700, #1442a8)' : 'var(--fg-muted)',
                font: `${activeFilter === f.v ? 600 : 500} 12px -apple-system, sans-serif`,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Scenarios list ── */}
      {scenarios.length === 0 ? (
        <div style={{
          background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
          <p style={{ margin: 0, font: '600 15px -apple-system, sans-serif', color: 'var(--fg)' }}>Bu kategoride henüz senaryo yok</p>
          {userId && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: 16, padding: '10px 20px', borderRadius: 999, border: 'none',
                background: 'var(--k-blue-500, #2a6cf0)', color: '#fff',
                font: '600 13px -apple-system, sans-serif', cursor: 'pointer',
              }}
            >
              İlk senaryoyu sen oluştur!
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} userId={userId} />
          ))}
        </div>
      )}

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid var(--stroke, #e4e7ed)',
            background: 'var(--surface, #fff)',
            color: 'var(--k-blue-500, #2a6cf0)',
            font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Yükleniyor...' : 'Daha fazla göster'}
        </button>
      )}

      {/* Create scenario modal */}
      {showCreate && userId && (
        <CreateScenarioModal
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreated={(newScenario) => {
            setScenarios((prev) => [newScenario, ...prev])
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

function CreateScenarioModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string
  onClose: () => void
  onCreated: (s: Scenario) => void
}) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('genel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const CATEGORIES = [
    { value: 'genel', label: 'Genel' },
    { value: 'ask', label: 'Aşk' },
    { value: 'is', label: 'İş' },
    { value: 'aile', label: 'Aile' },
    { value: 'sosyal', label: 'Sosyal' },
    { value: 'teknoloji', label: 'Teknoloji' },
    { value: 'dunya', label: 'Dünya' },
    { value: 'mizah', label: 'Mizah' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Bir hata oluştu.'); return }
      onCreated({ ...data.scenario, answered: false })
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(15,19,32,0.45)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface, #fff)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, padding: 20, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 18px 50px rgba(15,19,32,.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
        }}>
          <h2 style={{ margin: 0, font: '700 18px -apple-system, sans-serif', color: 'var(--fg)' }}>
            Senaryo oluştur
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', fontSize: 20 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Senaryonu yaz — bir karar, bir ikilem, bir soru…"
            maxLength={280}
            rows={5}
            style={{
              width: '100%', resize: 'none',
              font: '400 15px/1.5 -apple-system, sans-serif',
              border: '1px solid var(--stroke, #e4e7ed)',
              borderRadius: 10, padding: '14px 16px',
              background: 'var(--surface-2, #f7f8fa)',
              color: 'var(--fg)', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ textAlign: 'right', font: '400 12px monospace', color: content.length > 250 ? '#f97316' : 'var(--fg-subtle)' }}>
            {content.length}/280
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '8px 12px', borderRadius: 999,
                  border: `1px solid ${category === cat.value ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
                  background: category === cat.value ? 'var(--k-blue-500, #2a6cf0)' : 'var(--surface-2, #f7f8fa)',
                  color: category === cat.value ? '#fff' : 'var(--fg-muted)',
                  font: `${category === cat.value ? 600 : 500} 12.5px -apple-system, sans-serif`,
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 18px', borderRadius: 999, border: '1px solid var(--stroke, #e4e7ed)',
              background: 'transparent', color: 'var(--fg-muted)',
              font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
            }}>
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || content.trim().length < 20}
              style={{
                padding: '10px 20px', borderRadius: 999, border: 'none',
                background: 'var(--k-blue-500, #2a6cf0)', color: '#fff',
                font: '600 13px -apple-system, sans-serif', cursor: 'pointer',
                opacity: (loading || content.trim().length < 20) ? 0.5 : 1,
              }}
            >
              {loading ? 'Yayınlanıyor...' : 'Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
