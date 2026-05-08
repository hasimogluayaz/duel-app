'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { validateAnswer } from '@/lib/utils/validation'
import { timeAgo, formatPoints } from '@/lib/utils/formatting'
import { getTier, getTierProgress } from '@/lib/utils/tier'
import type { Profile, Scenario, Answer } from '@/types'
import {
  Swords, Search, ExternalLink, Clock, CheckCircle,
  Star, Flame, Send, Sparkles, Trophy, Users, Lock,
  ChevronRight, Zap, Target, TrendingUp, LogIn
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function useNextScenarioCountdown() {
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      // Next scenario at 03:00 Turkey time = 00:00 UTC
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

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  activeDuels: any[]
  userId: string | null
  communityAnswers: any[]
  recentDuels: any[]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Gece geç saatlerde de burada 🌙'
  if (h < 12) return 'Günaydın ☀️'
  if (h < 18) return 'İyi günler 👋'
  return 'İyi akşamlar 🌆'
}

const WRITING_TIPS = [
  'Özgün ol — kimsenin yazmadığını yaz.',
  'Esprili, dürüst ya da çılgın — seçim senin.',
  'Somut detaylar cevabını güçlendirir.',
  'En iyi cevaplar beklenmedik olanlar.',
  'Kısa ve net mi, uzun ve epik mi?',
]

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
  const [tipIdx] = useState(() => Math.floor(Math.random() * WRITING_TIPS.length))
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [answerSort, setAnswerSort] = useState<'top' | 'new'>('top')

  const nextScenarioCountdown = useNextScenarioCountdown()

  const isGuest = !userId

  const tier = profile ? getTier(profile.total_points) : null
  const tierProgress = profile ? getTierProgress(profile.total_points) : null

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
    setJustSubmitted(true)
    toast('Cevabın kaydedildi! +5 puan 🎉', 'success')
    setSubmitting(false)
    router.refresh()
  }

  async function quickMatch() {
    if (!userAnswer) { toast('Önce bugünkü senaryoya cevap ver!', 'error'); return }
    setQuickMatching(true)
    const res = await fetch('/api/duel/quickmatch', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Rakip bulunamadı.', 'error'); setQuickMatching(false); return }
    toast('Hızlı düello başladı! ⚔️', 'success')
    router.push(`/duel/${json.duel.share_token}`)
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

  const charCount = answer.length
  const charPercent = Math.round((charCount / 280) * 100)

  const sortedAnswers = [...communityAnswers].sort((a, b) => {
    if (answerSort === 'top') return (b.vote_count ?? 0) - (a.vote_count ?? 0)
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* ── Guest banner ─────────────────────────────── */}
      {isGuest && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/20 p-5">
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-purple-500/10" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-pink-500/10" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
              <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain brightness-0 invert" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-fg">Bugünkü senaryoya katıl! 🔥</p>
              <p className="text-sm text-fg-muted">Cevabını yaz, kapış, oy topla — tamamen ücretsiz.</p>
            </div>
            <Link href="/kayit" className="shrink-0">
              <Button size="sm" className="btn-gradient whitespace-nowrap">
                Ücretsiz Katıl
                <ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Logged-in welcome — tier + progress ─────── */}
      {profile && tier && tierProgress && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/20 p-5">
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-purple-500/10" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-pink-500/10" />
          <div className="relative">
            {/* Top row */}
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/profil/${profile.username}`}>
                <div className={`p-0.5 rounded-full ring-2 ${tier.ringColor}`}>
                  <Avatar src={profile.avatar_url} username={profile.username} size="lg" />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-fg-muted leading-none mb-0.5">{getGreeting()}</p>
                <h2 className="text-lg font-black text-fg truncate">
                  {profile.display_name || profile.username}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                    {tier.emoji} {tier.label}
                  </span>
                  {(profile as any).personality_type && (
                    <span className="text-xs text-fg-subtle bg-surface border border-stroke px-2 py-0.5 rounded-full">
                      🧠 {(profile as any).personality_type}
                    </span>
                  )}
                </div>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center hidden sm:block">
                  <div className="text-base font-black text-fg">{formatPoints(profile.total_points)}</div>
                  <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                    <Star size={9} className="text-amber-400 fill-amber-400" /> puan
                  </div>
                </div>
                {profile.streak_count > 0 && (
                  <div className="text-center" title={(profile as any).streak_freeze_count > 0 ? `${(profile as any).streak_freeze_count} streak freeze hakkın var 🧊` : 'Streak freeze hakkın kalmadı'}>
                    <div className="text-base font-black text-amber-400">{profile.streak_count}</div>
                    <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                      <Flame size={9} className="text-amber-400" /> seri
                      {(profile as any).streak_freeze_count > 0 && (
                        <span className="ml-0.5 text-blue-400">🧊{(profile as any).streak_freeze_count}</span>
                      )}
                    </div>
                  </div>
                )}
                {activeDuels.length > 0 && (
                  <div className="text-center">
                    <div className="text-base font-black text-purple-400">{activeDuels.length}</div>
                    <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                      <Swords size={9} className="text-purple-400" /> aktif
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tier progress bar */}
            {tierProgress.next && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-semibold ${tier.color}`}>{tier.emoji} {tier.label}</span>
                  <span className="text-fg-subtle">{tierProgress.pointsNeeded} puan → {tierProgress.next.emoji} {tierProgress.next.label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-700`}
                    style={{ width: `${tierProgress.progress}%` }}
                  />
                </div>
              </div>
            )}
            {!tierProgress.next && (
              <div className="flex items-center gap-2 text-xs text-yellow-300">
                <span>👑</span>
                <span className="font-bold">Maksimum tier — Efsane statüsü!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Today's scenario ─────────────────────────── */}
      {!scenario ? (
        <Card className="text-center py-14">
          <p className="text-5xl mb-4">🌙</p>
          <h2 className="text-xl font-bold text-fg mb-2">Bugünkü senaryo hazırlanıyor</h2>
          <p className="text-fg-subtle text-sm">Birazdan yeni senaryo yayınlanacak.</p>
          {nextScenarioCountdown && (
            <p className="text-xs text-purple-400 mt-2 font-mono font-bold">{nextScenarioCountdown}</p>
          )}
        </Card>
      ) : (
        <Card glow>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="info" className="flex items-center gap-1.5">
              <Sparkles size={11} />
              Günün Senaryosu
            </Badge>
            <div className="flex items-center gap-2">
              {communityAnswers.length > 0 && (
                <span className="text-xs text-fg-subtle flex items-center gap-1">
                  <Users size={11} />
                  {communityAnswers.length} cevap
                </span>
              )}
              <span className="text-xs text-fg-subtle">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <p className="text-xl font-bold text-fg leading-relaxed">{scenario.content}</p>
          {userAnswer && nextScenarioCountdown && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
              <Clock size={11} className="text-purple-400" />
              <span>Yeni senaryo: </span>
              <span className="font-mono font-bold text-purple-400">{nextScenarioCountdown}</span>
            </div>
          )}
        </Card>
      )}

      {/* ── Answer section ───────────────────────────── */}
      {scenario && (
        userAnswer ? (
          /* Post-answer state */
          <div className="space-y-3">
            <Card className="border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={13} className="text-green-400" />
                </div>
                <span className="text-sm font-semibold text-green-400">
                  Cevabın kaydedildi
                  {justSubmitted && <span className="ml-1 animate-pulse">· +5 puan 🎉</span>}
                </span>
              </div>
              <blockquote className="text-fg bg-bg rounded-xl p-4 leading-relaxed border-l-2 border-green-500/30 text-sm italic">
                &ldquo;{userAnswer.content}&rdquo;
              </blockquote>
            </Card>

            {/* Duel action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={quickMatch}
                disabled={quickMatching}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-600/20 to-pink-500/10 hover:border-purple-400/60 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer text-left"
              >
                {quickMatching ? (
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap size={22} className="text-purple-400" />
                )}
                <div>
                  <p className="text-sm font-black text-fg">Hızlı Düello</p>
                  <p className="text-xs text-fg-muted">Rastgele rakip bul</p>
                </div>
                <span className="absolute top-2 right-2 text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                  Yeni
                </span>
              </button>

              <button
                onClick={() => setDuelModal(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-stroke bg-surface hover:border-purple-500/40 hover:bg-purple-500/5 hover:scale-[1.02] transition-all cursor-pointer text-left"
              >
                <Target size={22} className="text-fg-muted" />
                <div>
                  <p className="text-sm font-black text-fg">İsimli Düello</p>
                  <p className="text-xs text-fg-muted">Birini seç ve çağır</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Write answer state */
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-purple-400" />
                <h3 className="text-base font-bold text-fg">Cevabını Yaz</h3>
              </div>
              {isGuest ? (
                <span className="flex items-center gap-1 text-xs text-fg-subtle">
                  <Lock size={11} />
                  Kayıt gerekli
                </span>
              ) : (
                <span className="text-xs text-fg-subtle italic flex items-center gap-1">
                  <Sparkles size={10} className="text-purple-400" />
                  {WRITING_TIPS[tipIdx]}
                </span>
              )}
            </div>

            <div className="relative">
              <Textarea
                placeholder={isGuest
                  ? 'Cevabını yazmak için tıkla ve katıl...'
                  : 'Cevabını buraya yaz... Özgün, eğlenceli ya da dürüst — seçim senin.'}
                value={answer}
                onChange={e => {
                  if (isGuest) { setJoinModal(true); return }
                  setAnswer(e.target.value)
                }}
                onFocus={() => { if (isGuest) setJoinModal(true) }}
                rows={4}
                maxLength={280}
                charCount={isGuest ? undefined : charCount}
                maxChars={isGuest ? undefined : 280}
                className={isGuest ? 'cursor-pointer' : ''}
                readOnly={isGuest}
              />
              {isGuest && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-bg/50 backdrop-blur-[2px] cursor-pointer"
                  onClick={() => setJoinModal(true)}
                >
                  <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-4 py-2.5 shadow-lg">
                    <Lock size={15} className="text-purple-400" />
                    <span className="text-sm font-semibold text-fg">Cevaplamak için katıl</span>
                  </div>
                </div>
              )}
            </div>

            {!isGuest && (
              <>
                {/* Char progress */}
                <div className="mt-2 h-1 rounded-full bg-stroke overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      charPercent > 90 ? 'bg-red-500' : charPercent > 70 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>

                <Button
                  onClick={submitAnswer}
                  loading={submitting}
                  disabled={answer.trim().length < 10}
                  className="w-full mt-4 btn-gradient"
                  size="lg"
                >
                  <Send size={16} />
                  Cevapla — +5 puan kazan
                </Button>

                {answer.trim().length > 0 && answer.trim().length < 10 && (
                  <p className="text-xs text-fg-subtle text-center mt-2">En az 10 karakter gerekli</p>
                )}
              </>
            )}

            {isGuest && (
              <div className="flex gap-2 mt-4">
                <Link href="/kayit" className="flex-1">
                  <Button className="w-full btn-gradient">
                    <Sparkles size={14} />
                    Ücretsiz Kayıt Ol
                  </Button>
                </Link>
                <Link href="/giris" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <LogIn size={14} />
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )
      )}

      {/* ── Active duels ─────────────────────────────── */}
      {!isGuest && activeDuels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-fg flex items-center gap-2">
              <Swords size={16} className="text-purple-400" />
              Aktif Düellolar
              <span className="text-xs font-normal bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {activeDuels.length}
              </span>
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {activeDuels.map((duel: any) => {
              const isChallenger = duel.challenger_id === userId
              const opponent = isChallenger ? duel.challenged : duel.challenger
              const opponentTier = opponent ? getTier(opponent.total_points ?? 0) : null
              return (
                <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                  <Card className="hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-fg group-hover:text-purple-300 transition-colors">
                              vs {opponent?.display_name || opponent?.username}
                            </p>
                            {opponentTier && (
                              <span className={`text-xs font-bold ${opponentTier.color}`}>
                                {opponentTier.emoji}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {duel.status === 'pending' && <Badge variant="warning">Kabul Bekleniyor</Badge>}
                            {duel.status === 'active' && <Badge variant="info">⚡ Oylanıyor</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                        <Clock size={11} />
                        {timeAgo(duel.created_at)}
                        <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Community answers ────────────────────────── */}
      {communityAnswers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-fg flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Topluluktan Cevaplar
              <span className="text-xs font-normal bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {communityAnswers.length}
              </span>
            </h2>
            {/* Sort toggle */}
            {!isGuest && (
              <div className="flex items-center bg-surface border border-stroke rounded-lg p-0.5 text-xs gap-0.5">
                <button
                  onClick={() => setAnswerSort('top')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${answerSort === 'top' ? 'bg-purple-600 text-white' : 'text-fg-muted hover:text-fg'}`}
                >
                  ⭐ Top
                </button>
                <button
                  onClick={() => setAnswerSort('new')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${answerSort === 'new' ? 'bg-purple-600 text-white' : 'text-fg-muted hover:text-fg'}`}
                >
                  🆕 Yeni
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {sortedAnswers.map((a: any, i: number) => {
              const isOwn = a.user_id === userId
              const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
              const shouldBlur = isGuest && i >= 2

              return (
                <div
                  key={a.id}
                  className={`relative rounded-xl border p-4 transition-all ${
                    isOwn
                      ? 'border-purple-500/30 bg-purple-500/5'
                      : 'border-stroke bg-surface hover:border-stroke/80'
                  } ${shouldBlur ? 'cursor-pointer' : ''}`}
                  onClick={shouldBlur ? () => setJoinModal(true) : undefined}
                >
                  {/* Rank badge for top answers */}
                  {!shouldBlur && i < 3 && (a.vote_count ?? 0) > 0 && (
                    <div className="absolute -top-2.5 left-3">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full border bg-surface border-amber-500/40 text-amber-400">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} #{i + 1}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-start gap-3 ${shouldBlur ? 'blur-sm select-none' : ''}`}>
                    <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-fg">
                          {p?.display_name || p?.username || 'Kullanıcı'}
                        </span>
                        {isOwn && <Badge variant="info" className="text-xs">Sen</Badge>}
                        <div className="ml-auto flex items-center gap-2">
                          {(a.vote_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                              <Star size={10} className="fill-amber-400" />
                              {a.vote_count}
                            </span>
                          )}
                          {!isOwn && !shouldBlur && userAnswer && p?.id && (
                            <button
                              onClick={() => challengeFromAnswer(p.id, p.username)}
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold px-2 py-0.5 rounded-lg hover:bg-purple-500/10 transition-all border border-purple-500/20 hover:border-purple-400/40"
                            >
                              <Swords size={10} />
                              Meydan Oku
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">{a.content}</p>
                    </div>
                  </div>

                  {shouldBlur && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/60 backdrop-blur-[3px]">
                      <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-2 shadow-md">
                        <Lock size={13} className="text-purple-400" />
                        <span className="text-xs font-semibold text-fg">Görmek için katıl</span>
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
              className="mt-3 w-full text-center text-sm text-purple-400 hover:text-purple-300 font-semibold py-2 border border-dashed border-purple-500/30 rounded-xl hover:border-purple-400/40 transition-colors"
            >
              +{communityAnswers.length - 2} cevap daha — katılınca gör →
            </button>
          )}
        </div>
      )}

      {/* ── Recent duels feed ────────────────────────── */}
      {recentDuels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-fg flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              Son Düellolar
            </h2>
            <Link href="/liderlik" className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Liderlik →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentDuels.map((duel: any) => (
              <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                <Card className="hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 shrink-0">
                      <Avatar src={duel.challenger?.avatar_url} username={duel.challenger?.username || '?'} size="xs" />
                      <span className="text-xs font-black text-fg-subtle px-1">vs</span>
                      <Avatar src={duel.challenged?.avatar_url} username={duel.challenged?.username || '?'} size="xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-fg font-medium truncate">
                        {duel.challenger?.username} vs {duel.challenged?.username}
                      </p>
                      {duel.ai_verdict && (
                        <p className="text-xs text-fg-subtle truncate italic">🏆 {duel.ai_verdict}</p>
                      )}
                    </div>
                    <ExternalLink size={12} className="text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────── */}
      {!isGuest && activeDuels.length === 0 && userAnswer && !justSubmitted && (
        <Card className="text-center py-8 border-dashed">
          <Swords size={28} className="text-fg-subtle mx-auto mb-3 opacity-50" />
          <p className="text-fg font-semibold mb-1">Aktif düellon yok</p>
          <p className="text-fg-subtle text-sm mb-4">Hızlı düello başlat veya birini çağır!</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={quickMatch} loading={quickMatching} size="sm" className="btn-gradient">
              <Zap size={13} />
              Hızlı Düello
            </Button>
            <Button onClick={() => setDuelModal(true)} variant="secondary" size="sm">
              <Target size={13} />
              İsimli Düello
            </Button>
          </div>
        </Card>
      )}

      {/* ── Join modal ───────────────────────────────── */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title="Katıl ve kapış! 🔥">
        <p className="text-sm text-fg-muted mb-5 text-center">
          Cevap yazmak, oy toplamak ve düelloya girmek için
          <br />
          ücretsiz hesap oluştur — 30 saniye yeter.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/kayit" onClick={() => setJoinModal(false)}>
            <Button className="w-full btn-gradient" size="lg">
              <Sparkles size={16} />
              Ücretsiz Kayıt Ol
            </Button>
          </Link>
          <Link href="/giris" onClick={() => setJoinModal(false)}>
            <Button variant="secondary" className="w-full">
              <LogIn size={15} />
              Zaten hesabım var — Giriş Yap
            </Button>
          </Link>
        </div>
        <p className="text-center text-xs text-fg-subtle mt-4">
          Kredi kartı gerekmez · Tamamen ücretsiz
        </p>
      </Modal>

      {/* ── Direct challenge confirm modal ───────────── */}
      <Modal
        open={!!directChallengeTarget}
        onClose={() => setDirectChallengeTarget(null)}
        title="Meydan Okuma ⚔️"
      >
        <p className="text-sm text-fg-muted mb-5 text-center">
          <span className="font-bold text-fg">@{directChallengeTarget?.username}</span> adlı kullanıcıyı
          <br />bugünkü senaryo için düelloya çağıracaksın.
        </p>
        <div className="flex gap-2">
          <Button
            className="flex-1 btn-gradient"
            loading={inviting === directChallengeTarget?.id}
            onClick={() => directChallengeTarget && inviteUser(directChallengeTarget.id)}
          >
            <Swords size={14} />
            Çağır!
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setDirectChallengeTarget(null)}>
            Vazgeç
          </Button>
        </div>
      </Modal>

      {/* ── Duel invite modal ────────────────────────── */}
      <Modal open={duelModal} onClose={() => setDuelModal(false)} title="İsimli Düello ⚔️">
        {!userAnswer ? (
          <div className="text-center py-4">
            <p className="text-fg-muted text-sm mb-4">Düelloya çağırmak için önce bugünkü senaryoya cevap vermelisin.</p>
            <Button onClick={() => setDuelModal(false)} variant="secondary" size="sm">Kapat</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-fg-muted mb-4">
              Hangi kullanıcıyı düelloya çağırmak istiyorsun?
            </p>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                placeholder="Kullanıcı adı ara..."
                value={searchQuery}
                onChange={e => searchUsers(e.target.value)}
                className="w-full bg-bg border border-stroke rounded-xl pl-9 pr-4 py-2.5 text-fg placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            {searchLoading && (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                {searchResults.map(user => {
                  const userTier = getTier((user as any).total_points ?? 0)
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-stroke hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} username={user.username} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-fg">{user.display_name || user.username}</p>
                            <span className={`text-xs font-bold ${userTier.color}`}>{userTier.emoji}</span>
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
