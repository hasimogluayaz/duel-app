'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints } from '@/lib/utils/formatting'
import type { Profile } from '@/types'
import Link from 'next/link'
import { Search, Flame, Star, Users, TrendingUp } from 'lucide-react'

export default function KesfetPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`)
    const json = await res.json()
    setUsers(json.users ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery, search])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Users size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Keşfet</h1>
          <p className="text-sm text-fg-subtle">Oyuncuları bul ve profillerine bak</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
        <input
          type="text"
          placeholder="Kullanıcı adı veya isim ara..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-purple-500 transition-colors"
          autoFocus
        />
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        {query.length >= 2 ? (
          <>
            <Search size={14} className="text-fg-subtle" />
            <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
              &quot;{query}&quot; için sonuçlar
            </span>
          </>
        ) : (
          <>
            <TrendingUp size={14} className="text-fg-subtle" />
            <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
              En İyi Oyuncular
            </span>
          </>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <Card className="text-center py-14 border-dashed">
          <Users size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
          <p className="text-fg font-semibold">Kullanıcı bulunamadı</p>
          <p className="text-fg-subtle text-sm mt-1">Farklı bir arama dene</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user, idx) => (
            <Link key={user.id} href={`/profil/${user.username}`}>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-surface border border-stroke hover:border-purple-500/40 hover:bg-purple-500/5 transition-all cursor-pointer group">

                {/* Rank number for default view */}
                {!query && (
                  <span className="text-sm font-bold text-fg-subtle w-5 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                )}

                <Avatar src={user.avatar_url} username={user.username} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-fg text-sm group-hover:text-purple-300 transition-colors truncate">
                      {user.display_name || user.username}
                    </p>
                    {user.personality_type && (
                      <Badge variant="default" className="text-xs hidden sm:inline-flex shrink-0">
                        🧠 {user.personality_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-fg-subtle">@{user.username}</p>
                  {user.bio && (
                    <p className="text-xs text-fg-muted mt-1 line-clamp-1">{user.bio}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="flex items-center gap-1 justify-end">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-fg">{formatPoints(user.total_points)}</span>
                    </div>
                    <p className="text-xs text-fg-subtle">puan</p>
                  </div>
                  {user.streak_count > 0 && (
                    <div>
                      <div className="flex items-center gap-1 justify-end text-amber-400">
                        <Flame size={11} />
                        <span className="text-sm font-bold">{user.streak_count}</span>
                      </div>
                      <p className="text-xs text-fg-subtle">seri</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
