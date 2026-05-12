'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { formatPoints } from '@/lib/utils/formatting'

interface Entry {
  rank: number
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  points: number
  is_me?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_COLORS = ['#d97706', '#6b7280', '#b45309']

export default function MiniLeaderboard() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard?period=weekly')
      .then(r => r.json())
      .then(d => { setEntries((d.entries ?? []).slice(0, 5)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 36, borderRadius: 10, background: 'var(--stroke)' }} />
      ))}
    </div>
  )

  if (entries.length === 0) return (
    <p style={{ font: '400 12px Geist, sans-serif', color: 'var(--fg-subtle)', textAlign: 'center', padding: '12px 0' }}>
      Henüz sıralama yok
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {entries.map((u) => (
        <Link
          key={u.id}
          href={`/profil/${u.username}`}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, background: u.is_me ? 'var(--k-blue-50)' : 'transparent', transition: 'background .12s' }}
          className="hover:bg-surface-2"
        >
          {/* Rank */}
          <span style={{
            width: 20, textAlign: 'center',
            font: `${u.rank <= 3 ? '800' : '700'} ${u.rank <= 3 ? '14px' : '12px'} Geist, sans-serif`,
            color: u.rank <= 3 ? RANK_COLORS[u.rank - 1] : 'var(--fg-subtle)',
            letterSpacing: '-0.02em', flexShrink: 0,
          }}>
            {u.rank <= 3 ? MEDALS[u.rank - 1] : u.rank}
          </span>

          {/* Avatar */}
          <Avatar src={u.avatar_url} username={u.username} size="xs" />

          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 12.5px Geist, sans-serif', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.display_name || u.username}
            </div>
          </div>

          {/* Points */}
          <span className="tab-nums" style={{ font: '600 11.5px Geist Mono, monospace', color: 'var(--fg-muted)', flexShrink: 0 }}>
            {formatPoints(u.points)}
          </span>
        </Link>
      ))}
    </div>
  )
}
