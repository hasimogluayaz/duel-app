'use client'

import { useState } from 'react'

interface Props {
  answerId: string
  initialVotes: number
  userId: string | null
}

export default function VoteButton({ answerId, initialVotes, userId }: Props) {
  const [votes, setVotes] = useState(initialVotes)
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleVote() {
    if (!userId || voted || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      if (res.ok) {
        setVotes((v) => v + 1)
        setVoted(true)
        // Update vote mission progress
        fetch('/api/missions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mission_type: 'vote_3' }),
        }).catch(() => {})
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={!userId || voted || loading}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors shrink-0 ${
        voted
          ? 'text-primary bg-primary/10'
          : userId
            ? 'text-fg-subtle hover:text-primary hover:bg-primary/10'
            : 'text-fg-subtle opacity-60 cursor-default'
      }`}
      title={!userId ? 'Oy vermek için giriş yap' : voted ? 'Oylandı' : 'Oyla'}
    >
      <span className="text-sm">▲</span>
      <span className="text-xs font-medium">{votes}</span>
    </button>
  )
}
