'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, User, BookOpen, Loader2, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { useDebounce } from '@/lib/hooks/useDebounce'

type Tab = 'users' | 'scenarios'

interface UserResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  follower_count?: number
}

interface ScenarioResult {
  id: string
  content: string
  category: string
  answer_count: number
  difficulty?: string
}

export default function AraPage() {
  const [query, setQuery]       = useState('')
  const [tab, setTab]           = useState<Tab>('users')
  const [users, setUsers]       = useState<UserResult[]>([])
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([])
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setUsers([])
      setScenarios([])
      return
    }
    search(debouncedQuery)
  }, [debouncedQuery, tab])

  async function search(q: string) {
    setLoading(true)
    try {
      if (tab === 'users') {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=users`)
        const data = await res.json()
        setUsers(data.users ?? [])
      } else {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=scenarios`)
        const data = await res.json()
        setScenarios(data.scenarios ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const DIFFICULTY_COLORS: Record<string, string> = {
    easy:   'text-green-400',
    medium: 'text-yellow-400',
    hard:   'text-red-400',
  }
  const DIFFICULTY_EMOJIS: Record<string, string> = { easy: '🟢', medium: '🟡', hard: '🔴' }

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">

        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Kullanıcı veya senaryo ara..."
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-2xl pl-10 pr-10 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 text-sm transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-[#1a1a2e] border border-white/10 rounded-xl p-1 mb-5 gap-1">
          {(['users', 'scenarios'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === t
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {t === 'users' ? <><User size={13} /> Kullanıcılar</> : <><BookOpen size={13} /> Senaryolar</>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-violet-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !query && (
          <div className="text-center py-16 text-white/30">
            <Search size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Kullanıcı adı, isim veya senaryo içeriği ara</p>
          </div>
        )}

        {!loading && query && tab === 'users' && users.length === 0 && (
          <div className="text-center py-10 text-white/30">
            <p className="text-sm">"{query}" için kullanıcı bulunamadı</p>
          </div>
        )}

        {!loading && query && tab === 'scenarios' && scenarios.length === 0 && (
          <div className="text-center py-10 text-white/30">
            <p className="text-sm">"{query}" için senaryo bulunamadı</p>
          </div>
        )}

        {/* User results */}
        {!loading && tab === 'users' && users.length > 0 && (
          <div className="space-y-2">
            {users.map(u => {
              const tier = getTier(u.total_points)
              return (
                <Link key={u.id} href={`/profil/${u.username}`}>
                  <div className="flex items-center gap-3 bg-[#1a1a2e] border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5 rounded-2xl p-3 transition-all cursor-pointer">
                    <Avatar src={u.avatar_url} username={u.username} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {u.display_name || u.username}
                        </p>
                        <span className={`text-xs font-bold shrink-0 ${tier.color}`}>{tier.emoji}</span>
                      </div>
                      <p className="text-xs text-white/40">@{u.username}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-white/30">{u.follower_count ?? 0} takipçi</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Scenario results */}
        {!loading && tab === 'scenarios' && scenarios.length > 0 && (
          <div className="space-y-2">
            {scenarios.map(s => (
              <Link key={s.id} href={`/arsiv/${s.id}`}>
                <div className="bg-[#1a1a2e] border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5 rounded-2xl p-4 transition-all cursor-pointer">
                  <p className="text-sm text-white leading-relaxed mb-2">{s.content}</p>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <span>{s.category}</span>
                    {s.difficulty && (
                      <span className={DIFFICULTY_COLORS[s.difficulty]}>
                        {DIFFICULTY_EMOJIS[s.difficulty]} {s.difficulty}
                      </span>
                    )}
                    <span className="ml-auto">{s.answer_count} cevap</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
