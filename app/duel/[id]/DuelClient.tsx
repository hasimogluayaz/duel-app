'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { timeUntil } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import { ShareCard } from '@/components/share/ShareCard'
import { Share2, Clock, Users, ExternalLink, Swords, Trophy, Zap, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { CommentsSection } from '@/components/duel/CommentsSection'
import { ReportButton } from '@/components/ui/ReportButton'

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
  const [voting, setVoting] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [currentDuel, setCurrentDuel] = useState(duel)
  const [rematchLoading, setRematchLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const isChallenger = userId === currentDuel.challenger_id

  const totalVotes = votesA + votesB
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50
  const percentB = 100 - percentA

  const isCompleted = currentDuel.status === 'completed'
  const isActive = currentDuel.status === 'active'
  const isPending = currentDuel.status === 'pending'
  const isParticipant = userId === currentDuel.challenger_id || userId === currentDuel.challenged_id
  const canVote = !isParticipant && userId && isActive && !userVote && currentDuel.vote_deadline

  const challengerTier = getTier(currentDuel.challenger?.total_points ?? 0)
  const challengedTier = getTier(currentDuel.challenged?.total_points ?? 0)

  const winnerIsChallenger = currentDuel.winner_id === currentDuel.challenger_id
  const winnerProfile = winnerIsChallenger ? currentDuel.challenger : currentDuel.challenged
  const loserProfile = winnerIsChallenger ? currentDuel.challenged : currentDuel.challenger

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
    setVoting(votedForId)

    const res = await fetch(`/api/duel/${currentDuel.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voted_for_id: votedForId }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Oy kullanılamadı.', 'error')
      setVoting(null)
      return
    }

    setUserVote(votedForId)
    toast('Oyun kullanıldı! 🗳️', 'success')
    setVoting(null)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast('Bağlantı kopyalandı!', 'success')
  }

  async function requestRematch() {
    if (!userId || !isParticipant) return
    setRematchLoading(true)

    try {
      // Find today's scenario to build a fresh duel
      const today = new Date().toISOString().split('T')[0]
      const supabaseClient = createClient()

      // Get today's scenario
      const { data: todayScenario } = await supabaseClient
        .from('scenarios')
        .select('id')
        .eq('active_date', today)
        .single()

      if (!todayScenario) {
        toast('Rövanş için bugünkü senaryoya cevap vermelisin.', 'error')
        setRematchLoading(false)
        return
      }

      // Get current user's answer for today
      const { data: myAnswer } = await supabaseClient
        .from('answers')
        .select('id')
        .eq('user_id', userId)
        .eq('scenario_id', todayScenario.id)
        .single()

      if (!myAnswer) {
        toast('Rövanş için önce bugünkü senaryoya cevap ver!', 'error')
        setRematchLoading(false)
        return
      }

      const opponentId = userId === currentDuel.challenger_id
        ? currentDuel.challenged_id
        : currentDuel.challenger_id

      const res = await fetch('/api/duel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenged_id: opponentId,
          scenario_id: todayScenario.id,
          challenger_answer_id: myAnswer.id,
        }),
      })

      const json = await res.json()
      setRematchLoading(false)

      if (!res.ok) {
        toast(json.error || 'Rövanş oluşturulamadı.', 'error')
        return
      }

      toast('Rövanş daveti gönderildi! ⚔️', 'success')
      window.location.href = `/duel/${json.duel.share_token}`
    } catch {
      toast('Bağlantı hatası. Tekrar dene.', 'error')
      setRematchLoading(false)
    }
  }

  const sides = [
    {
      id: currentDuel.challenger_id,
      profile: currentDuel.challenger,
      answer: currentDuel.challenger_answer,
      votes: votesA,
      percent: percentA,
      tier: challengerTier,
      label: 'Taraf A',
    },
    {
      id: currentDuel.challenged_id,
      profile: currentDuel.challenged,
      answer: currentDuel.challenged_answer,
      votes: votesB,
      percent: percentB,
      tier: challengedTier,
      label: 'Taraf B',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Arena header ─────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/8 to-secondary/15 p-6 mb-6">
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/8 rounded-full blur-2xl" />

        <div className="relative">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Canlı
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  ⏳ Bekleniyor
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary/70">
                  🏁 Tamamlandı
                </span>
              )}
              {isActive && timeLeft && (
                <span className="flex items-center gap-1 text-xs text-fg-subtle">
                  <Clock size={11} />
                  {timeLeft}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
                  <Share2 size={13} />
                  Paylaş
                </Button>
              )}
              <button onClick={copyLink} className="text-fg-subtle hover:text-fg p-1.5 rounded-lg hover:bg-surface transition-colors">
                <ExternalLink size={15} />
              </button>
            </div>
          </div>

          {/* VS display */}
          <div className="flex items-center justify-between gap-4">
            {/* Challenger */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className={`p-0.5 rounded-full ring-2 mb-2 ${sides[0].tier.ringColor} ${isCompleted && winnerIsChallenger ? 'ring-amber-400/60' : ''}`}>
                {isCompleted ? (
                  <Link href={`/profil/${sides[0].profile?.username}`}>
                    <Avatar src={sides[0].profile?.avatar_url} username={sides[0].profile?.username || '?'} size="lg" />
                  </Link>
                ) : (
                  <Avatar src={isCompleted ? sides[0].profile?.avatar_url : null} username="?" size="lg" />
                )}
              </div>
              {isCompleted ? (
                <>
                  <Link href={`/profil/${sides[0].profile?.username}`} className="text-sm font-black text-fg hover:text-primary/40 transition-colors">
                    {sides[0].profile?.display_name || sides[0].profile?.username}
                  </Link>
                  <span className={`text-xs font-bold ${sides[0].tier.color} mt-0.5`}>
                    {sides[0].tier.emoji} {sides[0].tier.label}
                  </span>
                </>
              ) : (
                <Badge variant="default" className="text-xs">Taraf A</Badge>
              )}
              {isCompleted && winnerIsChallenger && (
                <span className="text-xs font-black text-amber-400 mt-1">🏆 Kazanan</span>
              )}
            </div>

            {/* VS center */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                <Swords size={20} className="text-white" />
              </div>
              <span className="text-xs font-black text-fg-subtle tracking-widest">VS</span>
              {totalVotes > 0 && (
                <span className="text-xs text-fg-subtle flex items-center gap-1">
                  <Users size={10} />
                  {totalVotes}
                </span>
              )}
            </div>

            {/* Challenged */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className={`p-0.5 rounded-full ring-2 mb-2 ${sides[1].tier.ringColor} ${isCompleted && !winnerIsChallenger ? 'ring-amber-400/60' : ''}`}>
                {isCompleted ? (
                  <Link href={`/profil/${sides[1].profile?.username}`}>
                    <Avatar src={sides[1].profile?.avatar_url} username={sides[1].profile?.username || '?'} size="lg" />
                  </Link>
                ) : (
                  <Avatar src={isCompleted ? sides[1].profile?.avatar_url : null} username="?" size="lg" />
                )}
              </div>
              {isCompleted ? (
                <>
                  <Link href={`/profil/${sides[1].profile?.username}`} className="text-sm font-black text-fg hover:text-primary/40 transition-colors">
                    {sides[1].profile?.display_name || sides[1].profile?.username}
                  </Link>
                  <span className={`text-xs font-bold ${sides[1].tier.color} mt-0.5`}>
                    {sides[1].tier.emoji} {sides[1].tier.label}
                  </span>
                </>
              ) : (
                <Badge variant="default" className="text-xs">Taraf B</Badge>
              )}
              {isCompleted && !winnerIsChallenger && (
                <span className="text-xs font-black text-amber-400 mt-1">🏆 Kazanan</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scenario ─────────────────────────────────── */}
      <Card className="mb-5 border-stroke/60">
        <p className="text-xs text-fg-subtle mb-1.5 font-medium uppercase tracking-wide">Senaryo</p>
        <p className="text-fg font-semibold leading-relaxed">{currentDuel.scenario?.content}</p>
      </Card>

      {/* ── Pending state ────────────────────────────── */}
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-5 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-amber-300 font-semibold mb-1">Davet bekleniyor</p>
          <p className="text-amber-300/70 text-sm">Davet edilen kişi cevap verdikten sonra oylama başlayacak.</p>
          {isChallenger && (
            <button
              onClick={async () => {
                if (!confirm('Düello davetini iptal etmek istediğinizden emin misiniz?')) return
                setCancelLoading(true)
                const res = await fetch(`/api/duel/${currentDuel.id}/cancel`, { method: 'POST' })
                setCancelLoading(false)
                if (res.ok) {
                  toast('Düello daveti iptal edildi.', 'success')
                  window.location.href = '/oyun'
                } else {
                  const j = await res.json()
                  toast(j.error || 'İptal edilemedi.', 'error')
                }
              }}
              disabled={cancelLoading}
              className="mt-4 flex items-center gap-1.5 mx-auto text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={12} />
              {cancelLoading ? 'İptal ediliyor...' : 'Daveti İptal Et'}
            </button>
          )}
        </div>
      )}

      {/* ── Answers ──────────────────────────────────── */}
      {!isPending && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {sides.map((side, i) => {
              const isWinner = isCompleted && currentDuel.winner_id === side.id
              const isLoser = isCompleted && currentDuel.winner_id && currentDuel.winner_id !== side.id
              const isVotedFor = userVote === side.id
              const leadingNow = !isCompleted && totalVotes >= 3 && side.votes > (sides[1 - i].votes)

              return (
                <div
                  key={side.id}
                  className={`
                    relative rounded-2xl border p-5 transition-all
                    ${isWinner ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20' : ''}
                    ${isLoser ? 'border-stroke bg-surface opacity-70' : ''}
                    ${!isCompleted ? 'border-stroke bg-surface' : ''}
                    ${leadingNow && !isCompleted ? 'border-primary/40 bg-primary/5' : ''}
                  `}
                >
                  {isWinner && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-black shadow-lg">
                        🏆 Kazanan
                      </span>
                    </div>
                  )}
                  {leadingNow && !isCompleted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-white border border-primary/70/30">
                        ⚡ Önde
                      </span>
                    </div>
                  )}

                  {/* Player info (only revealed after completion) */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar src={side.profile?.avatar_url} username={side.profile?.username || '?'} size="sm" />
                      <div>
                        <Link href={`/profil/${side.profile?.username}`} className="text-sm font-bold text-fg hover:text-primary/70 transition-colors">
                          {side.profile?.display_name || side.profile?.username}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-fg-subtle">@{side.profile?.username}</p>
                          <span className={`text-xs font-bold ${side.tier.color}`}>{side.tier.emoji}</span>
                        </div>
                      </div>
                      {isVotedFor && <Badge variant="info" className="ml-auto text-xs">Oyun</Badge>}
                    </div>
                  )}
                  {!isCompleted && (
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="default">{side.label}</Badge>
                      {isVotedFor && <Badge variant="info" className="text-xs">✓ Oyunu</Badge>}
                    </div>
                  )}

                  <p className="text-fg leading-relaxed text-sm mb-4">{side.answer?.content}</p>

                  {/* Vote count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-sm font-bold text-fg-muted">
                        <Users size={13} />
                        <span>{side.votes}</span>
                      </div>
                      {totalVotes > 0 && (
                        <span className="text-xs text-fg-subtle">
                          (%{side.percent})
                        </span>
                      )}
                    </div>

                    {canVote && (
                      <Button
                        size="sm"
                        variant={i === 0 ? 'primary' : 'secondary'}
                        loading={voting === side.id}
                        disabled={voting !== null}
                        onClick={() => vote(side.id)}
                        className={i === 0 ? 'btn-gradient' : ''}
                      >
                        Bu cevabı seç ✓
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Live vote bar ─────────────────────────── */}
          {totalVotes > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-2 font-bold">
                <span className={percentA >= percentB ? 'text-primary/70' : 'text-fg-subtle'}>
                  {isCompleted ? (sides[0].profile?.username || 'A') : 'Taraf A'} · {percentA}%
                </span>
                <span className="text-fg-subtle flex items-center gap-1">
                  <Users size={10} />
                  {totalVotes} toplam oy
                </span>
                <span className={percentB > percentA ? 'text-primary/70' : 'text-fg-subtle'}>
                  {percentB}% · {isCompleted ? (sides[1].profile?.username || 'B') : 'Taraf B'}
                </span>
              </div>
              {/* Split bar */}
              <div className="h-3 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary transition-all duration-700 rounded-l-full"
                  style={{ width: `${percentA}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-secondary to-rose-500 transition-all duration-700 rounded-r-full"
                  style={{ width: `${percentB}%` }}
                />
              </div>
            </div>
          )}

          {/* ── AI Verdict ───────────────────────────── */}
          {isCompleted && currentDuel.ai_verdict && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 mb-5">
              <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-400">AI Kararı</p>
                    <p className="text-xs text-fg-subtle">Yapay zeka hakemliği</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                      🏆 {isCompleted ? (winnerProfile?.display_name || winnerProfile?.username || '?') : ''} kazandı
                    </span>
                  </div>
                </div>
                <p className="text-fg font-semibold leading-relaxed mb-3">{currentDuel.ai_verdict}</p>
                {currentDuel.ai_roast && (
                  <div className="bg-bg/60 rounded-xl p-3 border border-stroke/60">
                    <p className="text-xs text-fg-subtle mb-1 font-semibold">
                      😅 {loserProfile?.username || 'Kaybeden'}&apos;e özel:
                    </p>
                    <p className="text-amber-300/90 italic text-sm leading-relaxed">&ldquo;{currentDuel.ai_roast}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Voter CTA states ─────────────────────── */}
          {!userId && (
            <Card className="text-center py-5">
              <p className="text-fg-muted text-sm mb-3">Oy kullanmak için giriş yapman gerekiyor.</p>
              <Link href={`/giris?redirect=/duel/${currentDuel.share_token}`}>
                <Button className="btn-gradient">Giriş Yap ve Oy Ver</Button>
              </Link>
            </Card>
          )}

          {userId && userVote && !isCompleted && (
            <div className="text-center text-sm text-fg-subtle py-4 flex items-center justify-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
              Oyunu kullandın — sonuç 24 saat içinde açıklanacak.
            </div>
          )}

          {isParticipant && isActive && (
            <div className="text-center text-sm text-fg-subtle py-4 bg-surface border border-stroke rounded-xl">
              <Swords size={14} className="inline mr-1.5 text-primary/70" />
              Kendi düellona oy veremezsin. Oylama sürüyor...
            </div>
          )}

          {/* ── Post-duel CTA ─────────────────────────── */}
          {isCompleted && (
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link href="/oyun" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Zap size={14} />
                  Bugün oyna
                </Button>
              </Link>
              {isParticipant && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  loading={rematchLoading}
                  onClick={requestRematch}
                >
                  <RotateCcw size={14} />
                  Rövanş İste
                </Button>
              )}
              <button
                onClick={() => setShowShare(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Share2 size={14} />
                Paylaş
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Report + Comments ────────────────────────── */}
      {isCompleted && (
        <div className="flex justify-end mb-1">
          <ReportButton targetType="duel" targetId={currentDuel.id} userId={userId} />
        </div>
      )}
      {(isCompleted || isActive) && (
        <CommentsSection duelId={currentDuel.id} userId={userId} />
      )}

      {/* ── Share modal ──────────────────────────────── */}
      {showShare && isCompleted && (
        <ShareCard
          duel={currentDuel}
          winnerProfile={winnerProfile}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
