'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import { timeUntil } from '@/lib/utils/formatting'
import { ShareCard } from '@/components/share/ShareCard'
import { Share2, Clock, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Props {
  duel: any
  votesA: number
  votesB: number
  userId: string | null
  userVote: string | null
}

export function DuelClient({ duel, votesA: initialVotesA, votesB: initialVotesB, userId, userVote: initialVote }: Props) {
  const supabase = createClient()
  const toast = useToast()

  const [votesA, setVotesA] = useState(initialVotesA)
  const [votesB, setVotesB] = useState(initialVotesB)
  const [userVote, setUserVote] = useState(initialVote)
  const [voting, setVoting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [currentDuel, setCurrentDuel] = useState(duel)

  const totalVotes = votesA + votesB
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50

  const isCompleted = currentDuel.status === 'completed'
  const isActive = currentDuel.status === 'active'
  const isPending = currentDuel.status === 'pending'
  const isParticipant = userId === currentDuel.challenger_id || userId === currentDuel.challenged_id
  const canVote = !isParticipant && userId && isActive && !userVote && currentDuel.vote_deadline

  useEffect(() => {
    if (!currentDuel.vote_deadline) return
    const timer = setInterval(() => {
      setTimeLeft(timeUntil(currentDuel.vote_deadline))
    }, 1000)
    return () => clearInterval(timer)
  }, [currentDuel.vote_deadline])

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`duel:${currentDuel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `duel_id=eq.${currentDuel.id}` },
        (payload: any) => {
          if (payload.new.voted_for_id === currentDuel.challenger_id) {
            setVotesA(v => v + 1)
          } else {
            setVotesB(v => v + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${currentDuel.id}` },
        (payload: any) => {
          setCurrentDuel((prev: any) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentDuel.id])

  async function vote(votedForId: string) {
    if (!userId || !canVote) return
    setVoting(true)

    const res = await fetch(`/api/duel/${currentDuel.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voted_for_id: votedForId }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Oy kullanılamadı.', 'error')
      setVoting(false)
      return
    }

    setUserVote(votedForId)
    toast('Oyun kullanıldı!', 'success')
    setVoting(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast('Bağlantı kopyalandı!', 'success')
  }

  const winnerIsChallenger = currentDuel.winner_id === currentDuel.challenger_id

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <div>
            <h1 className="text-xl font-black text-fg">Düello</h1>
            {isActive && currentDuel.vote_deadline && (
              <div className="flex items-center gap-1 text-xs text-fg-subtle mt-0.5">
                <Clock size={12} />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
              <Share2 size={14} />
              Paylaş
            </Button>
          )}
          <button onClick={copyLink} className="text-fg-muted hover:text-fg p-2 rounded-lg hover:bg-surface">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Scenario */}
      <Card className="mb-6 bg-bg border-stroke">
        <p className="text-xs text-fg-subtle mb-2">Senaryo</p>
        <p className="text-fg font-medium leading-relaxed">{currentDuel.scenario?.content}</p>
      </Card>

      {/* Status */}
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-center">
          <p className="text-amber-300 text-sm">
            ⏳ Davet edilen kişinin cevap vermesi bekleniyor...
          </p>
        </div>
      )}

      {/* Answers */}
      {!isPending && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              {
                id: currentDuel.challenger_id,
                profile: currentDuel.challenger,
                answer: currentDuel.challenger_answer,
                votes: votesA,
                label: 'Düellocu A',
              },
              {
                id: currentDuel.challenged_id,
                profile: currentDuel.challenged,
                answer: currentDuel.challenged_answer,
                votes: votesB,
                label: 'Düellocu B',
              },
            ].map((side, i) => {
              const isWinner = isCompleted && currentDuel.winner_id === side.id
              const isLoser = isCompleted && currentDuel.winner_id && currentDuel.winner_id !== side.id
              const isVotedFor = userVote === side.id

              return (
                <div
                  key={side.id}
                  className={`
                    relative bg-surface border rounded-xl p-5 transition-all
                    ${isWinner ? 'border-amber-500/60 ring-1 ring-amber-500/20' : ''}
                    ${isLoser ? 'border-stroke opacity-75' : ''}
                    ${!isCompleted && !isLoser ? 'border-stroke' : ''}
                  `}
                >
                  {isWinner && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gold">🏆 Kazanan</Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    {isCompleted ? (
                      <>
                        <Avatar src={side.profile?.avatar_url} username={side.profile?.username || '?'} size="sm" />
                        <div>
                          <Link href={`/profil/${side.profile?.username}`} className="text-sm font-bold text-fg hover:text-purple-400">
                            {side.profile?.display_name || side.profile?.username}
                          </Link>
                          <p className="text-xs text-fg-subtle">@{side.profile?.username}</p>
                        </div>
                      </>
                    ) : (
                      <Badge variant="default">{side.label}</Badge>
                    )}
                    {isVotedFor && <Badge variant="info" className="ml-auto">Oyunu</Badge>}
                  </div>

                  <p className="text-fg leading-relaxed mb-4 text-sm">{side.answer?.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-fg-muted">
                      <Users size={14} />
                      <span>{side.votes} oy</span>
                    </div>

                    {canVote && !userVote && (
                      <Button
                        size="sm"
                        variant={i === 0 ? 'primary' : 'secondary'}
                        loading={voting}
                        onClick={() => vote(side.id)}
                      >
                        Bu cevabı seç
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vote progress */}
          <ProgressBar
            value={percentA}
            showLabels
            countA={votesA}
            countB={votesB}
            labelA="Düellocu A"
            labelB="Düellocu B"
            className="mb-6"
          />

          {/* AI Verdict */}
          {isCompleted && currentDuel.ai_verdict && (
            <Card glow className="mb-6 border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-bold text-amber-400">AI Kararı</span>
              </div>
              <p className="text-fg mb-3 font-medium">{currentDuel.ai_verdict}</p>
              {currentDuel.ai_roast && (
                <div className="bg-bg rounded-xl p-3 mt-3">
                  <p className="text-xs text-fg-subtle mb-1">Kaybedene mesaj:</p>
                  <p className="text-amber-300 italic text-sm">&ldquo;{currentDuel.ai_roast}&rdquo;</p>
                </div>
              )}
            </Card>
          )}

          {/* Login prompt */}
          {!userId && (
            <Card className="text-center">
              <p className="text-fg-muted mb-3">Oy kullanmak için giriş yapman gerekiyor.</p>
              <Link href={`/giris?redirect=/duel/${currentDuel.share_token}`}>
                <Button>Giriş Yap</Button>
              </Link>
            </Card>
          )}

          {userId && userVote && !isCompleted && (
            <div className="text-center text-sm text-fg-subtle py-4">
              ✅ Oyunu kullandın. Sonuç 24 saat içinde açıklanacak.
            </div>
          )}

          {isParticipant && isActive && (
            <div className="text-center text-sm text-fg-subtle py-4">
              Kendi düellona oy veremezsin. Sonuçlar bekleniyor...
            </div>
          )}
        </>
      )}

      {/* Share card modal */}
      {showShare && isCompleted && (
        <ShareCard
          duel={currentDuel}
          winnerProfile={winnerIsChallenger ? currentDuel.challenger : currentDuel.challenged}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
