'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, MessageSquare, Layers, Star, Trash2 } from 'lucide-react'

type TabType = 'answers' | 'scenarios'

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
  const [tab, setTab] = useState<TabType>('answers')
  const [answers, setAnswers] = useState<AnswerBookmark[]>([])
  const [scenarios, setScenarios] = useState<ScenarioBookmark[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set())

  const load = async (type: TabType) => {
    if (loadedTabs.has(type)) return
    setLoading(true)
    const res = await fetch(`/api/bookmarks?type=${type}`)
    const d = await res.json()
    if (type === 'answers') setAnswers(d.bookmarks ?? [])
    else setScenarios(d.bookmarks ?? [])
    setLoadedTabs(prev => new Set([...Array.from(prev), type]))
    setLoading(false)
  }

  useEffect(() => { load('answers') }, [])

  const switchTab = (t: TabType) => {
    setTab(t)
    load(t)
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center">
          <Bookmark size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-fg">Kaydettiklerim</h1>
          <p className="text-xs text-fg-subtle">Cevap ve senaryolarını buradan bulabilirsin</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-2xl p-1 mb-5">
        {([
          { id: 'answers' as TabType, label: 'Cevaplar', icon: <MessageSquare size={13} /> },
          { id: 'scenarios' as TabType, label: 'Senaryolar', icon: <Layers size={13} /> },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-fg-subtle hover:text-fg-muted'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-surface-2 rounded-2xl animate-pulse" />)}
        </div>
      ) : tab === 'answers' ? (
        answers.length === 0 ? (
          <EmptyState text="Kaydedilmiş cevap yok" />
        ) : (
          <div className="space-y-3">
            {answers.map(b => b.answer && (
              <div key={b.id} className="group bg-surface border border-stroke rounded-2xl p-4 hover:border-violet-500/30 transition-colors">
                {/* Scenario context */}
                {b.answer.scenario && (
                  <Link href={`/arsiv/${b.answer.scenario.id}`}>
                    <p className="text-xs text-fg-subtle italic mb-2 hover:text-violet-400 line-clamp-1 transition-colors">
                      &ldquo;{b.answer.scenario.content}&rdquo;
                    </p>
                  </Link>
                )}

                {/* Answer content */}
                <p className="text-sm text-fg leading-relaxed">{b.answer.content}</p>

                {/* Meta */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-fg-subtle">
                    {b.answer.user && (
                      <Link href={`/profil/${b.answer.user.username}`} className="hover:text-violet-400 transition-colors">
                        @{b.answer.user.username}
                      </Link>
                    )}
                    <span className="flex items-center gap-1">
                      <Star size={10} className="fill-amber-400/50 text-amber-400/50" />
                      {b.answer.vote_count}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAnswerBookmark(b.id, b.answer!.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all"
                    title="Kayıttan kaldır"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        scenarios.length === 0 ? (
          <EmptyState text="Kaydedilmiş senaryo yok" />
        ) : (
          <div className="space-y-3">
            {scenarios.map(b => b.scenario && (
              <Link key={b.id} href={`/arsiv/${b.scenario.id}`}>
                <div className="group bg-surface border border-stroke rounded-2xl p-4 hover:border-violet-500/30 transition-colors cursor-pointer">
                  <p className="text-sm text-fg leading-relaxed mb-3">{b.scenario.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-surface-2 border border-stroke text-fg-subtle px-2 py-0.5 rounded-full">
                        {b.scenario.category}
                      </span>
                      <span className="text-xs text-fg-subtle">{b.scenario.answer_count} cevap</span>
                    </div>
                    <button
                      onClick={e => { e.preventDefault(); removeScenarioBookmark(b.id, b.scenario!.id) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16 text-fg-subtle">
      <Bookmark size={36} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
      <p className="text-xs mt-1 text-fg-subtle opacity-60">Düello ve senaryo sayfalarından kaydet butonuna bas</p>
    </div>
  )
}
