'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Timer } from 'lucide-react'

interface Story {
  id: string
  content: string
  category: string
  expires_at: string
  author: { id?: string; username: string; display_name: string | null; avatar_url: string | null } | null
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Bitti'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}s`
  return `${m}d`
}

export function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios?stories_only=true&limit=15')
      .then(r => r.ok ? r.json() : { scenarios: [] })
      .then(d => {
        setStories(d.scenarios ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && stories.length === 0) return null

  return (
    <div className="border-b border-stroke bg-surface">
      <div
        className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
                <div className="w-14 h-14 rounded-full" style={{ background: 'var(--stroke)' }} />
                <div className="w-10 h-2 rounded" style={{ background: 'var(--stroke)' }} />
              </div>
            ))
          : stories.map(story => (
              <Link
                key={story.id}
                href={`/arsiv/${story.id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                {/* Ring + avatar */}
                <div
                  className="p-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #ed6f1c, #f58a3c, #fbbf24)',
                  }}
                >
                  <div
                    className="rounded-full p-[2px]"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Avatar
                      src={story.author?.avatar_url ?? null}
                      username={story.author?.username ?? '?'}
                      size="md"
                    />
                  </div>
                </div>
                {/* Username */}
                <span className="text-[10px] font-medium text-fg-muted max-w-[56px] truncate text-center leading-tight">
                  {story.author?.display_name || story.author?.username || 'Bilinmeyen'}
                </span>
                {/* Time left */}
                <span
                  className="flex items-center gap-0.5 text-[9px] font-bold"
                  style={{ color: 'var(--k3-warm-500)' }}
                >
                  <Timer size={8} />
                  {timeLeft(story.expires_at)}
                </span>
              </Link>
            ))
        }
      </div>
    </div>
  )
}
