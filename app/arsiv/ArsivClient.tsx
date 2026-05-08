'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ScenarioCard from '@/components/scenarios/ScenarioCard'

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
  userId: string | null
}

export default function ArsivClient({
  initialScenarios,
  categories,
  activeCategory,
  activeSort,
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

  return (
    <div className="min-h-screen bg-[#0f0f1a] pb-24">
      {/* Header */}
      <div className="bg-[#0f0f1a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-white">📚 Senaryo Arşivi</h1>
              <p className="text-xs text-white/40 mt-0.5">Tüm senaryolara cevap ver, puanları topla</p>
            </div>
            {userId && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <span>✍️</span>
                <span className="hidden sm:inline">Senaryo Oluştur</span>
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => navigate({ category: cat.value, sort: activeSort })}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2 pb-3">
            {(['recent', 'popular'] as const).map((s) => (
              <button
                key={s}
                onClick={() => navigate({ category: activeCategory, sort: s })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeSort === s
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {s === 'recent' ? '🕐 Yeni' : '🔥 Popüler'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios grid */}
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-3">
        {scenarios.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <div className="text-4xl mb-3">🤔</div>
            <p>Bu kategoride henüz senaryo yok.</p>
            {userId && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-violet-400 hover:text-violet-300 text-sm underline"
              >
                İlk senaryoyu sen oluştur!
              </button>
            )}
          </div>
        ) : (
          scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              userId={userId}
            />
          ))
        )}

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-3 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {loading ? 'Yükleniyor...' : 'Daha fazla göster'}
          </button>
        )}
      </div>

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
      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu.')
        return
      }
      onCreated({ ...data.scenario, answered: false })
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#1a1a2e] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-bold text-white">✍️ Senaryo Oluştur</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bir durum yaz... (en az 20 karakter)"
              maxLength={280}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-violet-500"
            />
            <div className={`text-right text-xs mt-1 ${content.length > 250 ? 'text-orange-400' : 'text-white/30'}`}>
              {content.length}/280
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || content.trim().length < 20}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Yayınlanıyor...' : 'Yayınla'}
          </button>
        </form>
      </div>
    </div>
  )
}
