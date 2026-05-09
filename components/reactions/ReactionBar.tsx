'use client'

import { useState, useEffect } from 'react'

const EMOJIS = ['🔥', '💯', '😂', '🤔', '😮'] as const

interface Props {
  answerId: string
  userId: string | null
  compact?: boolean
}

export default function ReactionBar({ answerId, userId, compact = false }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine]     = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/reactions?answer_id=${answerId}`)
      .then(r => r.json())
      .then(data => {
        setCounts(data.counts ?? {})
        setMine(data.mine ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [answerId])

  async function toggle(emoji: string) {
    if (!userId || pending) return
    setPending(emoji)

    // Optimistic update
    const alreadyMine = mine.includes(emoji)
    setCounts(prev => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (alreadyMine ? -1 : 1)),
    }))
    setMine(prev => alreadyMine ? prev.filter(e => e !== emoji) : [...prev, emoji])

    const res = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer_id: answerId, emoji }),
    })
    const data = await res.json()
    if (!res.ok) {
      // Revert on error
      setCounts(prev => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] ?? 0) + (alreadyMine ? 1 : -1)),
      }))
      setMine(prev => alreadyMine ? [...prev, emoji] : prev.filter(e => e !== emoji))
    } else {
      // Sync with server action
      if (data.action === 'added' && !mine.includes(emoji)) {
        // already optimistically added
      }
    }
    setPending(null)
  }

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0)

  if (loading) return (
    <div className={`flex gap-1 ${compact ? '' : 'flex-wrap'}`}>
      {EMOJIS.map(e => (
        <div key={e} className={`h-7 bg-white/5 rounded-full animate-pulse ${compact ? 'w-10' : 'w-14'}`} />
      ))}
    </div>
  )

  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'flex-wrap'}`}>
      {EMOJIS.map(emoji => {
        const count  = counts[emoji] ?? 0
        const ismine = mine.includes(emoji)
        const isPend = pending === emoji
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={!userId || isPend}
            title={!userId ? 'Tepki vermek için giriş yap' : undefined}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-all duration-150 select-none ${
              ismine
                ? 'bg-violet-500/20 border border-violet-500/40 text-white scale-105'
                : count > 0
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:scale-105'
                  : 'bg-white/3 border border-white/5 text-white/40 hover:bg-white/8 hover:text-white/60 hover:scale-105'
            } ${!userId ? 'cursor-default' : 'cursor-pointer'} ${isPend ? 'opacity-60' : ''}`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className={`text-xs font-medium tabular-nums ${ismine ? 'text-violet-300' : 'text-white/50'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
      {!compact && totalReactions > 0 && (
        <span className="text-xs text-white/20 ml-1">{totalReactions} tepki</span>
      )}
    </div>
  )
}
