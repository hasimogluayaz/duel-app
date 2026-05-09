'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { FollowButton } from '@/components/profile/FollowButton'
import { getTier } from '@/lib/utils/tier'
import { Users } from 'lucide-react'

interface Suggestion {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  total_points: number
  follower_count: number
  reason: string
}

export default function FollowSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/suggest')
      .then((r) => r.ok ? r.json() : { suggestions: [] })
      .then((d) => { setSuggestions(d.suggestions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const visible = suggestions.filter((s) => !dismissed.includes(s.id))

  if (loading) return (
    <div className="rounded-2xl bg-surface border border-stroke p-4 animate-pulse">
      <div className="h-4 bg-stroke rounded w-40 mb-3" />
      {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-stroke/50 rounded-xl mb-2" />)}
    </div>
  )

  if (visible.length === 0) return null

  return (
    <div className="rounded-2xl bg-surface border border-stroke overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stroke">
        <Users size={14} className="text-fg-subtle" />
        <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Tanıyor Olabilirsin</span>
      </div>
      <div>
        {visible.map((s) => {
          const tier = getTier(s.total_points)
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-stroke/50 last:border-0 hover:bg-surface-2 transition-colors">
              <Link href={`/profil/${s.username}`}>
                <Avatar src={s.avatar_url} username={s.username} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profil/${s.username}`} className="group">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-fg group-hover:text-purple-400 transition-colors truncate">
                      {s.display_name || s.username}
                    </span>
                    <span className="text-xs">{tier.emoji}</span>
                  </div>
                </Link>
                <p className="text-xs text-fg-subtle truncate">{s.reason}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <FollowButton
                  targetId={s.id}
                  initialFollowing={false}
                  size="sm"
                  onFollow={() => setDismissed((prev) => [...prev, s.id])}
                />
                <button
                  onClick={() => setDismissed((prev) => [...prev, s.id])}
                  className="text-fg-subtle hover:text-fg text-lg leading-none w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
