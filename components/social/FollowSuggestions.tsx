'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { FollowButton } from '@/components/profile/FollowButton'

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
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then(d => { setSuggestions(d.suggestions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const visible = suggestions.filter(s => !dismissed.includes(s.id))

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 44, borderRadius: 10, background: 'var(--stroke)' }} />
      ))}
    </div>
  )

  if (visible.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {visible.slice(0, 4).map(s => (
        <div
          key={s.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 10 }}
          className="hover:bg-surface-2 transition-colors"
        >
          <Link href={`/profil/${s.username}`} style={{ flexShrink: 0 }}>
            <Avatar src={s.avatar_url} username={s.username} size="sm" />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/profil/${s.username}`} style={{ textDecoration: 'none' }}>
              <div style={{ font: '600 13px Geist, sans-serif', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.display_name || s.username}
              </div>
              <div style={{ font: '400 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{s.username}
              </div>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <FollowButton
              targetId={s.id}
              initialFollowing={false}
              size="sm"
              onFollow={() => setDismissed(prev => [...prev, s.id])}
            />
            <button
              onClick={() => setDismissed(prev => [...prev, s.id])}
              style={{ color: 'var(--fg-subtle)', fontSize: 16, lineHeight: 1, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none' }}
              className="hover:text-fg transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
