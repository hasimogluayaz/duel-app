'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { Swords, ChevronRight, ThumbsUp } from 'lucide-react'

interface Answer {
  id: string
  content: string
  vote_count: number
  verdict_count: number
  author: { username: string; display_name: string; avatar_url: string | null; total_points?: number }
}

interface Scenario {
  id: string
  content: string
  category: string
}

interface Props {
  scenarioId?: string
  userId: string | null
}

export default function KararVerCard({ scenarioId, userId }: Props) {
  const [pair, setPair]         = useState<[Answer, Answer] | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading]   = useState(true)
  const [voted, setVoted]       = useState<string | null>(null)
  const [totalJudged, setTotalJudged] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null)

  const loadPair = useCallback(async () => {
    setLoading(true)
    setVoted(null)
    setAnimating(null)
    const url = scenarioId
      ? `/api/karar-ver?scenario_id=${scenarioId}`
      : '/api/karar-ver'
    const res = await fetch(url)
    const data = await res.json()
    setPair(data.pair ?? null)
    setScenario(data.scenario ?? null)
    setRemaining(data.remaining ?? 0)
    setLoading(false)
  }, [scenarioId])

  useEffect(() => { loadPair() }, [loadPair])

  async function vote(winnerId: string, loserId: string, side: 'left' | 'right') {
    if (!userId) return
    setAnimating(side)
    await fetch('/api/karar-ver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario?.id, winner_id: winnerId, loser_id: loserId }),
    })
    setVoted(winnerId)
    setTotalJudged(n => n + 1)
    setTimeout(() => loadPair(), 1200)
  }

  if (loading) return (
    <div className="rounded-2xl bg-surface border border-stroke p-6 animate-pulse">
      <div className="h-4 bg-surface-2 rounded w-48 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-40 bg-surface-2 rounded-xl" />
        <div className="h-40 bg-surface-2 rounded-xl" />
      </div>
    </div>
  )

  if (!pair || !scenario) return (
    <div className="rounded-2xl bg-surface border border-stroke p-8 text-center">
      <div className="text-4xl mb-3">🏆</div>
      <p className="text-fg font-semibold">Tüm cevapları gördün!</p>
      <p className="text-fg-subtle text-sm mt-1">{totalJudged} karar verdin bugün.</p>
      <Link href="/arsiv" className="inline-flex items-center gap-1 mt-4 text-primary/70 hover:text-primary/40 text-sm transition-colors">
        Daha fazla senaryo <ChevronRight size={14} />
      </Link>
    </div>
  )

  const [left, right] = pair

  return (
    <div className="rounded-2xl bg-surface border border-stroke overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Swords size={14} className="text-primary/70" />
          <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Karar Ver</span>
          {totalJudged > 0 && (
            <span className="ml-auto text-xs text-fg-subtle">{totalJudged} karar</span>
          )}
        </div>
        <p className="text-sm text-fg-muted italic leading-relaxed">
          &ldquo;{scenario.content}&rdquo;
        </p>
      </div>

      <div className="h-px bg-stroke" />

      {/* Answer pair */}
      <div className="grid grid-cols-2 gap-0">
        {([left, right] as Answer[]).map((answer, i) => {
          const side = i === 0 ? 'left' : 'right'
          const opponent = i === 0 ? right : left
          const isWinner = voted === answer.id
          const isLoser  = voted && voted !== answer.id
          const tier = getTier(answer.author?.total_points ?? 0)

          return (
            <button
              key={answer.id}
              onClick={() => !voted && userId && vote(answer.id, opponent.id, side)}
              disabled={!!voted || !userId}
              className={`relative p-4 text-left transition-all duration-300 group ${
                i === 0 ? 'border-r border-stroke' : ''
              } ${
                isWinner ? 'bg-green-500/15' :
                isLoser  ? 'bg-red-500/5 opacity-50' :
                voted    ? '' :
                userId   ? 'hover:bg-primary/10 cursor-pointer active:scale-95' :
                           'cursor-default'
              }`}
            >
              {/* Win overlay */}
              {isWinner && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-4xl animate-bounce">✅</div>
                </div>
              )}

              <div className={`flex flex-col gap-2 ${isWinner || isLoser ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <Avatar src={answer.author?.avatar_url} username={answer.author?.username} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg-muted truncate">
                      {answer.author?.display_name || answer.author?.username}
                    </p>
                    <p className="text-[10px] text-fg-subtle">{tier.emoji}</p>
                  </div>
                </div>
                <p className="text-sm text-fg leading-relaxed line-clamp-5">{answer.content}</p>
                <div className="flex items-center gap-2 text-xs text-fg-subtle mt-auto pt-1">
                  <ThumbsUp size={10} />
                  <span>{answer.vote_count + answer.verdict_count}</span>
                </div>
              </div>

              {!voted && userId && (
                <div className={`absolute bottom-2 ${i === 0 ? 'right-2' : 'left-2'} text-xs font-bold text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Seç →
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stroke flex items-center justify-between">
        {!userId ? (
          <Link href="/kayit" className="text-xs text-primary/70 hover:text-primary/40 transition-colors">
            Oy vermek için giriş yap →
          </Link>
        ) : voted ? (
          <span className="text-xs text-green-400">Kaydedildi! Sonraki yükleniyor...</span>
        ) : (
          <span className="text-xs text-fg-subtle">Hangisi daha iyi? Seç.</span>
        )}
        {remaining > 0 && (
          <span className="text-xs text-fg-subtle">{remaining} cevap daha var</span>
        )}
      </div>
    </div>
  )
}
