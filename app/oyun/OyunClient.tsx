'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { validateAnswer } from '@/lib/utils/validation'
import { timeAgo } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import type { Profile, Scenario, Answer } from '@/types'
import {
  Swords, Clock, CheckCircle, Search,
  Star, Sparkles, Users, Lock,
  Zap, Target, LogIn, ExternalLink, Flame, Trophy,
} from 'lucide-react'
import { TugBar } from '@/components/ui/TugBar'
import { ContentMenu } from '@/components/ui/ContentMenu'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import { ModeChip } from '@/components/ui/ModeChip'
import Link from 'next/link'
import Image from 'next/image'
import { ModeSwitcher } from '@/components/modes/ModeSwitcher'

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  activeDuels: any[]
  userId: string | null
  communityAnswers: any[]
  recentDuels: any[]
}

function useNextScenarioCountdown() {
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const next = new Date(now)
      next.setUTCHours(0, 0, 0, 0)
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
      const diff = next.getTime() - now.getTime()
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [])
  return countdown
}

export function OyunClient({
  scenario, profile, userAnswer: initialAnswer,
  activeDuels, userId, communityAnswers, recentDuels
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userAnswer, setUserAnswer] = useState(initialAnswer)
  const [duelModal, setDuelModal] = useState(false)
  const [directChallengeTarget, setDirectChallengeTarget] = useState<{ id: string; username: string } | null>(null)
  const [joinModal, setJoinModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [quickMatching, setQuickMatching] = useState(false)
  const [feedFilter, setFeedFilter] = useState<'top' | 'new' | 'duels' | 'follow'>('top')
  const [followFeed, setFollowFeed] = useState<any[]>([])
  const [followLoading, setFollowLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const nextScenarioCountdown = useNextScenarioCountdown()
  const isGuest = !userId
  const tier = profile ? getTier(profile.total_points) : null
  const charCount = answer.length

  async function submitAnswer() {
    if (!scenario) return
    if (isGuest) { setJoinModal(true); return }
    const validation = validateAnswer(answer)
    if (!validation.valid) { toast(validation.error!, 'error'); return }
    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario.id, content: answer }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Cevap kaydedilemedi.', 'error'); setSubmitting(false); return }
    setUserAnswer(json.answer)
    toast('Cevabın kaydedildi! +5 puan 🎉', 'success')
    setSubmitting(false)
    router.refresh()
  }

  async function quickMatch() {
    if (!userAnswer) { toast('Önce bugünkü senaryoya cevap ver!', 'error'); return }
    setQuickMatching(true)
    try {
      const res = await fetch('/api/duel/quickmatch', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast(json.error || 'Rakip bulunamadı.', 'error'); setQuickMatching(false); return }
      toast('Hızlı düello başladı! ⚔️', 'success')
      router.push(`/duel/${json.duel.share_token}`)
    } catch {
      toast('Bağlantı hatası. Tekrar dene.', 'error')
      setQuickMatching(false)
    }
  }

  async function searchUsers(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_points')
      .ilike('username', `%${q}%`)
      .neq('id', userId ?? '')
      .limit(5)
    setSearchResults((data as Profile[]) ?? [])
    setSearchLoading(false)
  }

  async function inviteUser(targetId: string) {
    if (!scenario || !userAnswer) return
    setInviting(targetId)
    const res = await fetch('/api/duel/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenged_id: targetId,
        scenario_id: scenario.id,
        challenger_answer_id: userAnswer.id,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Davet gönderilemedi.', 'error'); setInviting(null); return }
    toast('Düello daveti gönderildi! ⚔️', 'success')
    setDuelModal(false)
    setDirectChallengeTarget(null)
    setInviting(null)
    router.push(`/duel/${json.duel.share_token}`)
  }

  function challengeFromAnswer(targetId: string, username: string) {
    if (isGuest) { setJoinModal(true); return }
    if (!userAnswer) { toast('Önce bugünkü senaryoya cevap ver!', 'error'); return }
    setDirectChallengeTarget({ id: targetId, username })
  }

  const answerSort = feedFilter === 'new' ? 'new' : 'top'
  const sortedAnswers = [...communityAnswers].sort((a, b) => {
    if (answerSort === 'top') return (b.vote_count ?? 0) - (a.vote_count ?? 0)
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })

  async function loadFollowFeed() {
    if (followLoading || followFeed.length > 0) return
    setFollowLoading(true)
    try {
      const res = await fetch('/api/feed/friends')
      if (res.ok) {
        const json = await res.json()
        setFollowFeed(json.items ?? [])
      }
    } catch {}
    setFollowLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto pb-6 overflow-hidden">

      {/* ── Mode switcher ── */}
      <div className="px-3 pt-3 pb-2">
        <ModeSwitcher />
      </div>

      {/* ── Guest banner ── */}
      {isGuest && (
        <div className="mx-3 mb-2 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
          <Sparkles size={16} className="text-primary shrink-0" />
          <p className="text-sm text-fg-muted flex-1">Cevap yaz, düelloya gir — <span className="font-semibold text-primary">ücretsiz</span></p>
          <Link href="/kayit">
            <Button size="sm" className="btn-gradient shrink-0">Katıl</Button>
          </Link>
        </div>
      )}

      {/* ── Today's scenario ── */}
      {!scenario ? (
        <div className="mx-3 text-center py-12 bg-surface border border-stroke rounded-2xl">
          <p className="text-3xl mb-3">🌙</p>
          <h2 className="text-base font-bold text-fg mb-1">Bugünkü senaryo hazırlanıyor</h2>
          {nextScenarioCountdown && (
            <p className="text-xs text-primary/70 mt-1 font-mono font-bold">{nextScenarioCountdown}</p>
          )}
        </div>
      ) : (
        /* ── Today's Hero — v3 arena card ── */
        <div className="mx-3 my-3">
          <section
            className="relative overflow-hidden text-white"
            style={{
              borderRadius: 22,
              background: 'linear-gradient(160deg, #0a1f55 0%, #1442a8 38%, #2a6cf0 100%)',
              boxShadow: 'var(--k-shadow-hero)',
              padding: 20,
            }}
          >
            {/* "?" watermark */}
            <div aria-hidden style={{
              position: 'absolute', right: -30, top: -50,
              font: '900 320px/1 Geist, sans-serif',
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-0.05em', userSelect: 'none', pointerEvents: 'none',
            }}>?</div>

            {/* Top status row */}
            <div className="relative flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 12px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                  font: '700 11px Geist, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <span className="live-dot" style={{ background: '#bff5d5' }} />
                  Günün Senaryosu
                </span>
                <span className="tab-nums" style={{ font: '500 12px Geist Mono, monospace', opacity: 0.7 }}>
                  {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </span>
              </div>
              {nextScenarioCountdown && (
                <span className="tab-nums" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  font: '600 12px Geist Mono, monospace', opacity: 0.95,
                }}>
                  <Clock size={13} /> Yenilenmeye {nextScenarioCountdown}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="relative k3-h-1 text-white break-words" style={{
              margin: '0 0 20px',
              fontSize: 'clamp(22px, 5vw, 32px)',
              textWrap: 'balance',
            }}>
              {scenario.content}
            </h2>

            {/* Tug bar (show when there are answers) */}
            {communityAnswers.length > 0 && (
              <div className="relative mb-4">
                <TugBar
                  warm={Math.round(communityAnswers.filter((a: any) => a.vote_count > 0).length / Math.max(communityAnswers.length, 1) * 100) || 50}
                  cool={Math.round(communityAnswers.filter((a: any) => !a.vote_count || a.vote_count === 0).length / Math.max(communityAnswers.length, 1) * 100) || 50}
                  compact
                  dark
                />
              </div>
            )}

            {/* Answered state */}
            {userAnswer ? (
              <div className="relative flex flex-col gap-3">
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 12,
                  padding: 14, borderRadius: 14,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={16} style={{ color: '#bff5d5', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 11px Geist, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 3 }}>
                        Cevabın
                      </div>
                      <div style={{ font: '600 15px Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        &ldquo;{userAnswer.content}&rdquo;
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={quickMatch}
                      disabled={quickMatching}
                      className="flex-1 flex items-center justify-center gap-1.5 font-semibold transition-all"
                      style={{ height: 40, borderRadius: 12, background: '#fff', color: 'var(--k-blue-700)', fontSize: 14 }}
                    >
                      {quickMatching
                        ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Swords size={15} />
                      }
                      Düello
                    </button>
                    <button
                      onClick={() => setDuelModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 font-semibold transition-all text-white"
                      style={{ height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.16)', fontSize: 14 }}
                    >
                      <Target size={15} />
                      İsimli Düello
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {}}
                className="flex items-center justify-center gap-2 text-white font-semibold transition-all"
                style={{ height: 48, padding: '0 24px', borderRadius: 12, background: '#fff', color: 'var(--k-blue-700)', fontSize: 15 }}
              >
                <Zap size={18} /> Tarafını seç, cevabını yaz
              </button>
            )}

            {/* Participation strip */}
            <div className="relative flex items-center gap-3 mt-4 flex-wrap" style={{ font: '500 12px Geist, sans-serif', opacity: 0.85 }}>
              <span className="tab-nums">
                <strong>{communityAnswers.length.toLocaleString('tr-TR')}</strong> cevap
              </span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', opacity: 0.4 }} />
              <span className="tab-nums" style={{ color: '#ffd4b3' }}>
                <strong>{recentDuels.filter((d: any) => d.status === 'active').length}</strong> aktif düello
              </span>
            </div>
          </section>
        </div>
      )}

      {/* ── Answer section ── */}
      {scenario && (
        userAnswer ? (
          <div className="space-y-0">
            {/* Active duels (CTAs already in hero card above) */}
            {activeDuels.length > 0 && (
              <div className="px-3 py-3">
                <p className="text-xs font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
                  <Swords size={11} className="text-primary/70" />
                  Aktif Düellolar ({activeDuels.length})
                </p>
                <div className="space-y-1.5">
                  {activeDuels.map((duel: any) => {
                    const isChallenger = duel.challenger_id === userId
                    const opponent = isChallenger ? duel.challenged : duel.challenger
                    return (
                      <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                        <div className="flex items-center gap-3 bg-surface border border-stroke rounded-xl px-3 py-2.5 hover:border-primary/30 transition-colors">
                          <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-fg truncate">vs {opponent?.display_name || opponent?.username}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            duel.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {duel.status === 'pending' ? 'Bekliyor' : 'Oylanıyor'}
                          </span>
                          <ExternalLink size={10} className="text-fg-subtle shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Write answer — Twitter compose style */
          <div className="bg-surface border-b border-stroke">
            <div className="relative px-4 pt-4 pb-2">
              <textarea
                placeholder={isGuest ? 'Cevaplamak için katıl...' : 'Ne düşünüyorsun? Özgün, dürüst ya da esprili...'}
                aria-label={isGuest ? 'Cevaplamak için kayıt ol' : 'Bugünkü senaryoya cevabın'}
                value={answer}
                onChange={e => {
                  if (isGuest) { setJoinModal(true); return }
                  setAnswer(e.target.value)
                }}
                onFocus={() => { if (isGuest) setJoinModal(true) }}
                rows={4}
                maxLength={280}
                readOnly={isGuest}
                className={`w-full bg-transparent text-base text-fg placeholder-fg-subtle resize-none focus:outline-none leading-relaxed ${isGuest ? 'cursor-pointer opacity-50' : ''}`}
              />
            </div>
            <div className="flex items-center justify-between px-4 pb-4 border-t border-stroke pt-3">
              <span className={`text-xs font-mono ${charCount > 260 ? 'text-red-400' : 'text-fg-subtle'}`}>
                {charCount > 0 ? `${280 - charCount}` : ''}
              </span>
              {!isGuest ? (
                <Button
                  onClick={submitAnswer}
                  loading={submitting}
                  disabled={answer.trim().length < 10}
                  size="sm"
                  className="btn-gradient px-5 font-bold"
                >
                  Cevapla +5p
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/kayit">
                    <Button size="sm" className="btn-gradient font-bold">Ücretsiz Katıl</Button>
                  </Link>
                  <Link href="/giris">
                    <Button size="sm" variant="secondary">Giriş</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Community Feed ── */}
      {communityAnswers.length > 0 && feedFilter !== 'duels' && feedFilter !== 'follow' && (
        <div>
          {/* Feed header */}
          <div className="px-3 py-3 border-b border-stroke">
            <h2 className="text-base font-bold text-fg mb-2.5 px-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              Bugünün Cevapları
              <span className="ml-2 text-sm font-normal text-fg-subtle">{communityAnswers.length}</span>
            </h2>
            {/* Filter chips — design style */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
              {([
                { id: 'top',    label: 'En çok oylanan', icon: <Trophy size={13} /> },
                { id: 'new',    label: 'Yeni',            icon: <Zap size={13} /> },
                { id: 'duels',  label: 'Düellolar',       icon: <Swords size={13} /> },
                { id: 'follow', label: 'Takip',           icon: <Users size={13} /> },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFeedFilter(f.id)
                    if (f.id === 'follow') loadFollowFeed()
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[13px] font-medium whitespace-nowrap transition-all border ${
                    feedFilter === f.id
                      ? 'bg-fg text-bg border-transparent'
                      : 'bg-surface text-fg-muted border-stroke hover:text-fg'
                  }`}
                >
                  {f.icon}{f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top answer highlight — only when sorting by top and there's a clear winner */}
          {answerSort === 'top' && sortedAnswers[0] && (sortedAnswers[0].vote_count ?? 0) > 0 && (() => {
            const a = sortedAnswers[0]
            const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
            const userTier = p ? getTier(p.total_points ?? 0) : null
            const isOwn = a.user_id === userId
            return (
              <div className="mx-3 my-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/20 bg-amber-500/8">
                  <Trophy size={12} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">En Çok Beğenilen</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Star size={10} className="fill-amber-400" />
                    {a.vote_count}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/profil/${p?.username}`}>
                      <Avatar src={p?.avatar_url} username={p?.username || '?'} size="xs" />
                    </Link>
                    <Link href={`/profil/${p?.username}`} className="hover:underline">
                      <span className="text-sm font-semibold text-fg">{p?.display_name || p?.username || 'Kullanıcı'}</span>
                    </Link>
                    {userTier && <span className={`text-xs ${userTier.color}`}>{userTier.emoji}</span>}
                    {isOwn && <span className="text-xs bg-primary/15 text-primary/70 px-1.5 py-0.5 rounded-full font-medium">Sen</span>}
                  </div>
                  <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {!isOwn && userAnswer && p?.id && (
                      <button
                        onClick={() => challengeFromAnswer(p.id, p.username)}
                        className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary font-medium transition-colors"
                      >
                        <Swords size={10} />
                        Meydan Oku
                      </button>
                    )}
                    {!isGuest && (
                      <div className="ml-auto">
                        <BookmarkButton type="answer" id={a.id} size={13} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Rest of the answers */}
          <div className="divide-y divide-stroke">
            {sortedAnswers.map((a: any, i: number) => {
              // Skip first when in top mode (already shown as highlight)
              if (answerSort === 'top' && i === 0 && (a.vote_count ?? 0) > 0) return null
              const isOwn = a.user_id === userId
              const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
              const shouldBlur = isGuest && i >= 2
              const userTier = p ? getTier(p.total_points ?? 0) : null

              return (
                <div
                  key={a.id}
                  className={`bg-surface px-4 py-3.5 transition-colors ${
                    isOwn ? 'bg-primary/5' : shouldBlur ? 'cursor-pointer hover:bg-surface-2' : 'hover:bg-surface-2'
                  }`}
                  onClick={shouldBlur ? () => setJoinModal(true) : undefined}
                >
                  {shouldBlur ? (
                    /* Locked overlay — no CSS blur (causes mobile layout issues) */
                    <div className="flex items-center justify-center py-5">
                      <div className="flex items-center gap-2 bg-surface-2 border border-stroke rounded-xl px-4 py-2 shadow-sm">
                        <Lock size={12} className="text-primary/70" />
                        <span className="text-xs font-semibold text-fg">Görmek için katıl</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Link href={`/profil/${p?.username}`}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        {/* Author row */}
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Link href={`/profil/${p?.username}`} className="hover:underline">
                            <span className="text-sm font-semibold text-fg">
                              {p?.display_name || p?.username || 'Kullanıcı'}
                            </span>
                          </Link>
                          {userTier && <span className={`text-xs ${userTier.color}`}>{userTier.emoji}</span>}
                          {isOwn && <span className="text-xs bg-primary/15 text-primary/70 px-1.5 py-0.5 rounded-full font-medium">Sen</span>}
                          {(a.vote_count ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold">
                              <Star size={10} className="fill-amber-400" />
                              {a.vote_count}
                            </span>
                          )}
                          <span className="ml-auto">
                            <ContentMenu
                              targetType="answer"
                              targetId={a.id}
                              userId={userId}
                              isOwn={isOwn}
                              size={13}
                            />
                          </span>
                        </div>

                        {/* Answer text */}
                        <p className="text-sm text-fg-muted leading-relaxed break-words">{a.content}</p>

                        {/* Action row */}
                        <div className="flex items-center gap-3 mt-2.5">
                          {!isOwn && userAnswer && p?.id && (
                            <button
                              onClick={() => challengeFromAnswer(p.id, p.username)}
                              className="flex items-center gap-1 text-xs text-fg-subtle hover:text-primary transition-colors font-medium"
                            >
                              <Swords size={10} />
                              Meydan Oku
                            </button>
                          )}
                          {!isGuest && (
                            <div className="ml-auto">
                              <BookmarkButton type="answer" id={a.id} size={13} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {isGuest && communityAnswers.length > 2 && (
            <button
              onClick={() => setJoinModal(true)}
              className="w-full text-center text-xs text-primary font-semibold py-3 border-t border-stroke hover:bg-surface-2 transition-colors"
            >
              +{communityAnswers.length - 2} cevap daha — katılınca gör →
            </button>
          )}
        </div>
      )}

      {/* ── Düellolar feed ── */}
      {feedFilter === 'duels' && (
        <div>
          <div className="px-3 py-3 border-b border-stroke">
            <h2 className="text-base font-bold text-fg tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              Düellolar
              <span className="ml-2 text-sm font-normal text-fg-subtle">{recentDuels.length}</span>
            </h2>
          </div>
          {recentDuels.length === 0 ? (
            <div className="text-center py-16">
              <Swords size={28} className="text-fg-subtle opacity-20 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">Henüz aktif düello yok</p>
            </div>
          ) : (
            <div className="divide-y divide-stroke">
              {recentDuels.map((duel: any) => {
                const totalVotes = (duel.votes_a ?? 0) + (duel.votes_b ?? 0)
                const pctA = totalVotes > 0 ? Math.round(((duel.votes_a ?? 0) / totalVotes) * 100) : 50
                const pctB = 100 - pctA
                return (
                  <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                    <div className="bg-surface px-4 py-4 hover:bg-surface-2 transition-colors">
                      {/* Avatars + vs */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={duel.challenger?.avatar_url} username={duel.challenger?.username || '?'} size="xs" />
                        <span className="text-xs font-black text-fg-subtle">vs</span>
                        <Avatar src={duel.challenged?.avatar_url} username={duel.challenged?.username || '?'} size="xs" />
                        <span className="text-sm font-semibold text-fg ml-1 truncate">
                          {duel.challenger?.username} <span className="text-fg-subtle font-normal">vs</span> {duel.challenged?.username}
                        </span>
                        <span className="ml-auto text-xs text-fg-subtle shrink-0">
                          {duel.status === 'active' ? '🟢 Oylanıyor' : duel.status === 'pending' ? '⏳ Bekliyor' : '✅ Bitti'}
                        </span>
                      </div>
                      {/* Scenario preview */}
                      {duel.scenario?.content && (
                        <p className="text-xs text-fg-subtle mb-2 line-clamp-1">{duel.scenario.content}</p>
                      )}
                      {/* Vote split bar — v3 TugBar */}
                      {totalVotes > 0 && (
                        <div className="mt-2">
                          <TugBar warm={pctA} cool={pctB} compact />
                          <p className="tab-nums text-[10px] text-fg-subtle mt-1">{totalVotes} oy</p>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Takip feed ── */}
      {feedFilter === 'follow' && (
        <div>
          <div className="px-3 py-3 border-b border-stroke">
            <h2 className="text-base font-bold text-fg tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              Takip Ettiklerim
            </h2>
          </div>
          {isGuest ? (
            <div className="text-center py-16 px-4">
              <Users size={28} className="text-fg-subtle opacity-20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-fg mb-1">Giriş gerekiyor</p>
              <p className="text-xs text-fg-subtle mb-4">Takip ettiğin kişilerin cevaplarını görmek için giriş yap</p>
              <Link href="/giris"><button className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: 'var(--k-blue-500)' }}>Giriş Yap</button></Link>
            </div>
          ) : followLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : followFeed.length === 0 ? (
            <div className="text-center py-16">
              <Users size={28} className="text-fg-subtle opacity-20 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">Takip ettiğin kişilerin cevabı yok</p>
              <Link href="/kesfet" className="text-xs text-primary mt-2 inline-block">Kullanıcı keşfet →</Link>
            </div>
          ) : (
            <div className="divide-y divide-stroke">
              {followFeed.map((item: any) => {
                const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                return (
                  <div key={item.id} className="bg-surface px-4 py-3.5 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start gap-3">
                      <Link href={`/profil/${p?.username}`}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Link href={`/profil/${p?.username}`} className="text-sm font-semibold text-fg hover:underline">
                            {p?.display_name || p?.username}
                          </Link>
                          <span className="text-xs text-fg-subtle">{timeAgo(item.created_at)}</span>
                        </div>
                        <p className="text-sm text-fg-muted leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Recent duels feed (shown on default tabs only) ── */}
      {feedFilter !== 'duels' && feedFilter !== 'follow' && recentDuels.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke">
            <h2 className="text-sm font-bold text-fg">Son Düellolar</h2>
            <Link href="/liderlik" className="text-xs text-primary font-semibold">
              Liderlik →
            </Link>
          </div>
          <div className="divide-y divide-stroke">
            {recentDuels.map((duel: any) => (
              <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                <div className="flex items-center gap-3 bg-surface px-4 py-3 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-1 shrink-0">
                    <Avatar src={duel.challenger?.avatar_url} username={duel.challenger?.username || '?'} size="xs" />
                    <span className="text-[10px] font-black text-fg-subtle">vs</span>
                    <Avatar src={duel.challenged?.avatar_url} username={duel.challenged?.username || '?'} size="xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      {duel.challenger?.username} vs {duel.challenged?.username}
                    </p>
                    {duel.ai_verdict && (
                      <p className="text-xs text-fg-subtle truncate italic mt-0.5">🏆 {duel.ai_verdict}</p>
                    )}
                  </div>
                  <ExternalLink size={11} className="text-fg-subtle shrink-0 opacity-60" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── User quick links if logged in ── */}
      {profile && tier && (
        <div className="flex items-center gap-2 pt-2 border-t border-stroke">
          <Link href={`/profil/${profile.username}`} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar src={profile.avatar_url} username={profile.username} size="xs" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fg truncate">{profile.display_name || profile.username}</p>
              <p className="text-[10px] text-fg-subtle">{tier.emoji} {tier.label} · {profile.total_points} puan</p>
            </div>
          </Link>
          {profile.streak_count > 0 && (
            <span className="text-xs text-amber-400 flex items-center gap-0.5 font-semibold shrink-0">
              <Flame size={11} /> {profile.streak_count}
            </span>
          )}
          <Link href={`/profil/${profile.username}`} className="text-xs text-fg-subtle hover:text-primary/70 transition-colors shrink-0 font-medium">
            Profilim →
          </Link>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isGuest && activeDuels.length === 0 && userAnswer && communityAnswers.length === 0 && (
        <div className="text-center py-8 bg-surface border border-dashed border-stroke rounded-2xl">
          <Swords size={24} className="text-fg-subtle mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-fg mb-1">Aktif düellon yok</p>
          <p className="text-xs text-fg-subtle mb-3">Hızlı düello başlat!</p>
          <Button onClick={quickMatch} loading={quickMatching} size="sm" className="btn-gradient">
            <Zap size={13} /> Hızlı Düello
          </Button>
        </div>
      )}

      {/* ── Join modal ── */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title="Katıl ve kapış! 🔥">
        <p className="text-sm text-fg-muted mb-5 text-center">
          Cevap yazmak, oy toplamak ve düelloya girmek için<br />
          ücretsiz hesap oluştur — 30 saniye yeter.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/kayit" onClick={() => setJoinModal(false)}>
            <Button className="w-full btn-gradient" size="lg"><Sparkles size={16} /> Ücretsiz Kayıt Ol</Button>
          </Link>
          <Link href="/giris" onClick={() => setJoinModal(false)}>
            <Button variant="secondary" className="w-full"><LogIn size={15} /> Zaten hesabım var — Giriş Yap</Button>
          </Link>
        </div>
        <p className="text-center text-xs text-fg-subtle mt-4">Kredi kartı gerekmez · Tamamen ücretsiz</p>
      </Modal>

      {/* ── Direct challenge confirm ── */}
      <Modal
        open={!!directChallengeTarget}
        onClose={() => setDirectChallengeTarget(null)}
        title="Meydan Okuma ⚔️"
      >
        <p className="text-sm text-fg-muted mb-5 text-center">
          <span className="font-bold text-fg">@{directChallengeTarget?.username}</span> adlı kullanıcıyı<br />
          bugünkü senaryo için düelloya çağıracaksın.
        </p>
        <div className="flex gap-2">
          <Button
            className="flex-1 btn-gradient"
            loading={inviting === directChallengeTarget?.id}
            onClick={() => directChallengeTarget && inviteUser(directChallengeTarget.id)}
          >
            <Swords size={14} /> Çağır!
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setDirectChallengeTarget(null)}>
            Vazgeç
          </Button>
        </div>
      </Modal>

      {/* ── Duel invite modal ── */}
      <Modal open={duelModal} onClose={() => setDuelModal(false)} title="İsimli Düello ⚔️">
        {!userAnswer ? (
          <div className="text-center py-4">
            <p className="text-fg-muted text-sm mb-4">Düelloya çağırmak için önce bugünkü senaryoya cevap vermelisin.</p>
            <Button onClick={() => setDuelModal(false)} variant="secondary" size="sm">Kapat</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-fg-muted mb-4">Hangi kullanıcıyı düelloya çağırmak istiyorsun?</p>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                placeholder="Kullanıcı adı ara..."
                value={searchQuery}
                onChange={e => searchUsers(e.target.value)}
                className="w-full bg-bg border border-stroke rounded-xl pl-9 pr-4 py-2.5 text-fg placeholder-fg-subtle focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
            {searchLoading && (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {searchResults.map(user => {
                  const userTier = getTier((user as any).total_points ?? 0)
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-stroke hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} username={user.username} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-fg">{user.display_name || user.username}</p>
                            <span className={`text-xs ${userTier.color}`}>{userTier.emoji}</span>
                          </div>
                          <p className="text-xs text-fg-subtle">@{user.username}</p>
                        </div>
                      </div>
                      <Button size="sm" loading={inviting === user.id} onClick={() => inviteUser(user.id)} className="btn-gradient">
                        Çağır
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
            {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <p className="text-center text-fg-subtle text-sm py-4">Kullanıcı bulunamadı.</p>
            )}
            {searchQuery.length === 0 && (
              <p className="text-center text-fg-subtle text-xs py-2">En az 2 karakter yaz</p>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
