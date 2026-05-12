'use client'

import { useState, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { timeUntil } from '@/lib/utils/formatting'
import {
  Clock, Users, ExternalLink, CheckCircle,
  Heart, Eye, Share2, Swords, MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

interface FeedDuel {
  id: string
  share_token: string
  vote_deadline: string | null
  created_at: string
  challenger_id: string
  challenged_id: string
  scenario: { content: string; mode?: string | null; category?: string | null } | null
  challenger:    { id: string; username: string; display_name: string | null; avatar_url: string | null; total_points: number } | null
  challenged:    { id: string; username: string; display_name: string | null; avatar_url: string | null; total_points: number } | null
  challenger_answer: { content: string } | null
  challenged_answer: { content: string } | null
  votesA:     number
  votesB:     number
  like_count: number
  view_count: number
  user_liked: boolean
}

// Mode badge config
const MODE_META: Record<string, { label: string; color: string; bg: string }> = {
  senaryo:  { label: 'Senaryo',  color: '#2a6cf0', bg: '#eef4ff' },
  tartisma: { label: 'Tartışma', color: '#1c2f6e', bg: '#e7ecf7' },
  emoji:    { label: 'Emoji',    color: '#1572c4', bg: '#d3eaff' },
  karakter: { label: 'Karakter', color: '#1442a8', bg: '#dbe7ff' },
  // category aliases
  ask:        { label: 'Aşk',     color: '#c05a8a', bg: '#fdf0f7' },
  aile:       { label: 'Aile',    color: '#d97706', bg: '#fff1e6' },
  is:         { label: 'İş',      color: '#16a34a', bg: '#ecfdf3' },
  teknoloji:  { label: 'Teknoloji', color: '#1442a8', bg: '#dbe7ff' },
  mizah:      { label: 'Mizah',   color: '#7c3aed', bg: '#f5f0ff' },
  sosyal:     { label: 'Sosyal',  color: '#0369a1', bg: '#e0f2fe' },
  genel:      { label: 'Senaryo', color: '#2a6cf0', bg: '#eef4ff' },
}

interface Props {
  duel: FeedDuel
  userId: string | null
  onVoted?: (duelId: string, winnerId: string, newVotesA: number, newVotesB: number) => void
}

export function DuelFeedCard({ duel: initialDuel, userId, onVoted }: Props) {
  const [duel, setDuel] = useState(initialDuel)
  const [voted, setVoted] = useState<string | null>(null)
  const [voting, setVoting] = useState<string | null>(null)
  const [liked, setLiked] = useState(initialDuel.user_liked)
  const [likeCount, setLikeCount] = useState(initialDuel.like_count)
  const [likePending, setLikePending] = useState(false)
  const [shared, setShared] = useState(false)

  const totalVotes = duel.votesA + duel.votesB
  const pctA = totalVotes > 0 ? Math.round((duel.votesA / totalVotes) * 100) : 50
  const pctB = 100 - pctA
  const tierA = getTier(duel.challenger?.total_points ?? 0)
  const tierB = getTier(duel.challenged?.total_points ?? 0)
  const canVote = !!userId && !voted

  // ── Vote ────────────────────────────────────────────────
  async function vote(votedForId: string) {
    if (!userId || voted || voting) return
    setVoting(votedForId)

    const res = await fetch(`/api/duel/${duel.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voted_for_id: votedForId }),
    })

    if (res.ok) {
      const newVotesA = votedForId === duel.challenger_id ? duel.votesA + 1 : duel.votesA
      const newVotesB = votedForId === duel.challenged_id ? duel.votesB + 1 : duel.votesB
      setDuel(d => ({ ...d, votesA: newVotesA, votesB: newVotesB }))
      setVoted(votedForId)
      onVoted?.(duel.id, votedForId, newVotesA, newVotesB)
    }
    setVoting(null)
  }

  // ── Like ────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!userId || likePending) return
    setLikePending(true)
    // Optimistic
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1))

    const res = await fetch(`/api/duel/${duel.id}/like`, { method: 'POST' })
    if (res.ok) {
      const json = await res.json()
      setLiked(json.liked)
      setLikeCount(json.like_count)
    } else {
      // Revert
      setLiked(liked)
      setLikeCount(likeCount)
    }
    setLikePending(false)
  }, [userId, liked, likeCount, likePending, duel.id])

  // ── Share ───────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/duel/${duel.share_token}`
    if (navigator.share) {
      await navigator.share({ title: duel.scenario?.content ?? 'Düello', url })
    } else {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }, [duel.share_token, duel.scenario?.content])

  const sides = [
    { side: 'A', profile: duel.challenger, answer: duel.challenger_answer, votes: duel.votesA, pct: pctA, tier: tierA, id: duel.challenger_id },
    { side: 'B', profile: duel.challenged, answer: duel.challenged_answer, votes: duel.votesB, pct: pctB, tier: tierB, id: duel.challenged_id },
  ]

  const mode = duel.scenario?.mode ?? duel.scenario?.category ?? 'senaryo'
  const modeMeta = MODE_META[mode] ?? MODE_META.senaryo

  return (
    <article className="rounded-2xl border border-stroke bg-surface overflow-hidden hover:border-primary/30 transition-all group/card">

      {/* ── Scenario header ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-stroke/60">
        {/* Mode type badge */}
        <div className="flex items-center gap-2 mb-2.5">
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 9px', borderRadius: 99,
            background: modeMeta.bg,
            color: modeMeta.color,
            font: '700 11px Geist, sans-serif',
            letterSpacing: '0.02em',
          }}>
            {modeMeta.label}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-fg leading-relaxed flex-1 line-clamp-2">
            {duel.scenario?.content ?? '—'}
          </p>
          <Link
            href={`/duel/${duel.share_token}`}
            className="text-fg-subtle hover:text-primary/70 transition-colors shrink-0 mt-0.5 opacity-0 group-hover/card:opacity-100"
          >
            <ExternalLink size={13} />
          </Link>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {duel.vote_deadline && (
            <span className="flex items-center gap-1 text-[11px] text-fg-subtle">
              <Clock size={10} />
              {timeUntil(duel.vote_deadline)}
            </span>
          )}
          {totalVotes > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-fg-subtle">
              <Users size={10} />
              {totalVotes} oy
            </span>
          )}
          {voted && (
            <span className="flex items-center gap-1 text-[11px] text-green-400 font-semibold">
              <CheckCircle size={10} />
              Oylandı
            </span>
          )}
        </div>
      </div>

      {/* ── Two answer columns ──────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-stroke/60">
        {sides.map((s) => {
          const isVotedFor   = voted === s.id
          const isOtherVoted = voted && voted !== s.id

          return (
            <div
              key={s.side}
              className={`p-3.5 flex flex-col gap-2.5 transition-all ${
                isVotedFor   ? 'bg-primary/8' : ''
              } ${isOtherVoted ? 'opacity-55' : ''}`}
            >
              {/* User info */}
              <Link href={`/profil/${s.profile?.username}`} className="flex items-center gap-2 group/user">
                <div className={`p-0.5 rounded-full ring-1 ${s.tier.ringColor} shrink-0`}>
                  <Avatar src={s.profile?.avatar_url} username={s.profile?.username ?? '?'} size="xs" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-fg truncate group-hover/user:text-primary/40 transition-colors">
                    {s.profile?.display_name || s.profile?.username || `Taraf ${s.side}`}
                  </p>
                  <span className={`text-[10px] font-bold ${s.tier.color}`}>{s.tier.emoji} {s.tier.label}</span>
                </div>
              </Link>

              {/* Answer */}
              <p className="text-xs text-fg-muted leading-relaxed line-clamp-4 flex-1 min-h-[3.5rem]">
                {s.answer?.content ?? <span className="italic opacity-50">Cevap bekleniyor…</span>}
              </p>

              {/* Vote button or result bar */}
              {voted ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isVotedFor ? 'text-primary/70 font-bold' : 'text-fg-subtle'}>
                      {s.pct}%
                    </span>
                    <span className="text-fg-subtle">{s.votes}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stroke overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        s.side === 'A'
                          ? 'bg-gradient-to-r from-primary to-primary'
                          : 'bg-gradient-to-r from-primary to-secondary'
                      }`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => vote(s.id)}
                  disabled={!canVote || voting !== null}
                  className={`
                    w-full py-1.5 rounded-lg text-[11px] font-bold transition-all border
                    ${!canVote
                      ? 'border-stroke text-fg-subtle cursor-not-allowed opacity-40'
                      : s.side === 'A'
                        ? 'border-primary/40 bg-primary/10 text-primary/70 hover:bg-primary/20 active:scale-95'
                        : 'border-secondary/40 bg-secondary/10 text-secondary/70 hover:bg-secondary/20 active:scale-95'
                    }
                  `}
                >
                  {voting === s.id ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Oylanıyor…
                    </span>
                  ) : canVote ? (
                    `${s.side === 'A' ? '⚔️' : '🛡️'} Oyla`
                  ) : (
                    `${s.pct}%`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Live vote bar (before voting) ────────────────── */}
      {!voted && totalVotes > 0 && (
        <div className="h-0.5 flex">
          <div
            className="bg-gradient-to-r from-primary to-primary transition-all duration-500"
            style={{ width: `${pctA}%` }}
          />
          <div
            className="bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${pctB}%` }}
          />
        </div>
      )}

      {/* ── Engagement action bar ─────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-stroke/40">
        <div className="flex items-center gap-4">

          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!userId}
            title={userId ? (liked ? 'Beğeniyi kaldır' : 'Beğen') : 'Beğenmek için giriş yap'}
            className={`flex items-center gap-1.5 text-xs transition-all group/like ${
              liked
                ? 'text-secondary'
                : userId
                  ? 'text-fg-subtle hover:text-secondary'
                  : 'text-fg-subtle opacity-40 cursor-not-allowed'
            }`}
          >
            <Heart
              size={14}
              className={`transition-transform group-hover/like:scale-110 ${liked ? 'fill-rose-400' : ''}`}
            />
            <span className="font-medium tabular-nums">{likeCount > 0 ? likeCount : ''}</span>
          </button>

          {/* Votes */}
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <Swords size={13} />
            <span className="tabular-nums">{totalVotes > 0 ? totalVotes : ''}</span>
          </span>

          {/* Views */}
          {duel.view_count > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <Eye size={13} />
              <span className="tabular-nums">
                {duel.view_count >= 1000
                  ? `${(duel.view_count / 1000).toFixed(1)}K`
                  : duel.view_count}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-xs text-fg-subtle hover:text-primary/70 transition-colors"
            title="Paylaş"
          >
            <Share2 size={13} />
            {shared && <span className="text-green-400 text-[10px]">Kopyalandı!</span>}
          </button>

          {/* Go to duel */}
          <Link
            href={`/duel/${duel.share_token}`}
            className="flex items-center gap-1 text-xs text-fg-subtle hover:text-primary/70 transition-colors"
            title="Düelloyu görüntüle"
          >
            <MessageCircle size={13} />
          </Link>
        </div>
      </div>

      {/* ── Guest CTA ─────────────────────────────────────── */}
      {!userId && (
        <div className="px-4 pb-3 text-center">
          <p className="text-[11px] text-fg-subtle">
            <Link href="/giris" className="text-primary/70 hover:underline font-semibold">Giriş yap</Link>
            {' '}veya{' '}
            <Link href="/kayit" className="text-primary/70 hover:underline font-semibold">kayıt ol</Link>
            {' '}— oy kullan ve beğen
          </p>
        </div>
      )}
    </article>
  )
}
