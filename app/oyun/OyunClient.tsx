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
  Swords, Search, Clock, CheckCircle,
  Star, Send, Sparkles, Users, Lock,
  ChevronRight, Zap, Target, LogIn, ExternalLink, MoreHorizontal, Flame
} from 'lucide-react'
import { ContentMenu } from '@/components/ui/ContentMenu'
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
  const [answerSort, setAnswerSort] = useState<'top' | 'new'>('top')
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

  const sortedAnswers = [...communityAnswers].sort((a, b) => {
    if (answerSort === 'top') return (b.vote_count ?? 0) - (a.vote_count ?? 0)
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* ── Mode switcher ── */}
      <ModeSwitcher />

      {/* ── Guest banner ── */}
      {isGuest && (
        <div className="flex items-center gap-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl px-4 py-3">
          <Image src="/logo.png" alt="Kapisio" width={24} height={24} className="w-6 h-6 object-contain opacity-80" />
          <p className="text-sm text-fg-muted flex-1">Cevap yazmak ve düello yapmak için <span className="font-semibold text-violet-500">ücretsiz katıl</span></p>
          <Link href="/kayit">
            <Button size="sm" className="btn-gradient shrink-0">Katıl</Button>
          </Link>
        </div>
      )}

      {/* ── Today's scenario ── */}
      {!scenario ? (
        <div className="text-center py-12 bg-surface border border-stroke rounded-2xl">
          <p className="text-3xl mb-3">🌙</p>
          <h2 className="text-base font-bold text-fg mb-1">Bugünkü senaryo hazırlanıyor</h2>
          {nextScenarioCountdown && (
            <p className="text-xs text-violet-400 mt-1 font-mono font-bold">{nextScenarioCountdown}</p>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-stroke rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} />
              Günün Senaryosu
            </span>
            <div className="flex items-center gap-2 text-xs text-fg-subtle">
              {communityAnswers.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={10} />
                  {communityAnswers.length}
                </span>
              )}
              <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
          <p className="text-lg font-bold text-fg leading-snug">{scenario.content}</p>
          {userAnswer && nextScenarioCountdown && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle border-t border-stroke pt-2">
              <Clock size={10} className="text-violet-400" />
              <span>Yeni senaryo: <span className="font-mono font-bold text-violet-400">{nextScenarioCountdown}</span></span>
            </div>
          )}
        </div>
      )}

      {/* ── Answer section ── */}
      {scenario && (
        userAnswer ? (
          <div className="space-y-3">
            {/* Your answer */}
            <div className="bg-surface border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={13} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">Cevabın kaydedildi</span>
              </div>
              <p className="text-sm text-fg leading-relaxed italic">&ldquo;{userAnswer.content}&rdquo;</p>
            </div>

            {/* Duel action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={quickMatch}
                disabled={quickMatching}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-violet-500/30 bg-violet-500/8 hover:bg-violet-500/15 hover:border-violet-500/50 transition-all disabled:opacity-50 text-sm font-semibold text-violet-400"
              >
                {quickMatching
                  ? <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  : <Zap size={15} />
                }
                Hızlı Düello
              </button>
              <button
                onClick={() => setDuelModal(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-stroke bg-surface hover:border-fg-subtle/30 hover:bg-surface-2 transition-all text-sm font-semibold text-fg-muted"
              >
                <Target size={15} />
                İsimli Düello
              </button>
            </div>

            {/* Active duels */}
            {activeDuels.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
                  <Swords size={11} className="text-violet-400" />
                  Aktif Düellolar ({activeDuels.length})
                </p>
                <div className="space-y-1.5">
                  {activeDuels.map((duel: any) => {
                    const isChallenger = duel.challenger_id === userId
                    const opponent = isChallenger ? duel.challenged : duel.challenger
                    return (
                      <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                        <div className="flex items-center gap-3 bg-surface border border-stroke rounded-xl px-3 py-2.5 hover:border-violet-500/30 transition-colors">
                          <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-fg truncate">vs {opponent?.display_name || opponent?.username}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
          /* Write answer */
          <div className="bg-surface border border-stroke rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send size={14} className="text-violet-400" />
              <h3 className="text-sm font-bold text-fg">Cevabını Yaz</h3>
              {isGuest && (
                <span className="ml-auto flex items-center gap-1 text-xs text-fg-subtle">
                  <Lock size={10} /> Kayıt gerekli
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                placeholder={isGuest ? 'Katılmak için tıkla...' : 'Ne düşünüyorsun? Özgün, dürüst ya da esprili...'}
                value={answer}
                onChange={e => {
                  if (isGuest) { setJoinModal(true); return }
                  setAnswer(e.target.value)
                }}
                onFocus={() => { if (isGuest) setJoinModal(true) }}
                rows={3}
                maxLength={280}
                readOnly={isGuest}
                className={`w-full bg-bg border border-stroke rounded-xl px-3 py-2.5 text-sm text-fg placeholder-fg-subtle resize-none focus:outline-none focus:border-violet-500/50 transition-colors ${isGuest ? 'cursor-pointer' : ''}`}
              />
              {isGuest && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer"
                  onClick={() => setJoinModal(true)}
                >
                  <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-2 shadow-sm">
                    <Lock size={13} className="text-violet-400" />
                    <span className="text-xs font-semibold text-fg">Cevaplamak için katıl</span>
                  </div>
                </div>
              )}
            </div>
            {!isGuest && (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-fg-subtle">{charCount}/280</span>
                  {charCount > 0 && charCount < 10 && (
                    <span className="text-xs text-fg-subtle">En az 10 karakter</span>
                  )}
                </div>
                <Button
                  onClick={submitAnswer}
                  loading={submitting}
                  disabled={answer.trim().length < 10}
                  className="w-full mt-3 btn-gradient"
                >
                  <Send size={14} />
                  Cevapla — +5 puan
                </Button>
              </>
            )}
            {isGuest && (
              <div className="flex gap-2 mt-3">
                <Link href="/kayit" className="flex-1">
                  <Button className="w-full btn-gradient" size="sm"><Sparkles size={13} /> Ücretsiz Kayıt Ol</Button>
                </Link>
                <Link href="/giris" className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm"><LogIn size={13} /> Giriş Yap</Button>
                </Link>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Community Feed ── */}
      {communityAnswers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-fg">Bugünün Cevapları</h2>
            <div className="flex border-b border-stroke text-xs">
              {(['top', 'new'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setAnswerSort(s)}
                  className={`px-3 py-1.5 font-semibold transition-all border-b-2 -mb-px ${answerSort === s ? 'border-fg text-fg' : 'border-transparent text-fg-subtle hover:text-fg-muted'}`}
                >
                  {s === 'top' ? 'Top' : 'Yeni'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-px rounded-2xl overflow-hidden border border-stroke">
            {sortedAnswers.map((a: any, i: number) => {
              const isOwn = a.user_id === userId
              const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
              const shouldBlur = isGuest && i >= 2
              const userTier = p ? getTier(p.total_points ?? 0) : null

              return (
                <div
                  key={a.id}
                  className={`relative bg-surface px-4 py-3.5 transition-colors ${
                    isOwn ? 'bg-violet-500/5' : 'hover:bg-surface-2'
                  } ${shouldBlur ? 'cursor-pointer' : ''}`}
                  onClick={shouldBlur ? () => setJoinModal(true) : undefined}
                >
                  <div className={shouldBlur ? 'blur-sm select-none' : ''}>
                    <div className="flex items-start gap-3">
                      <Link href={`/profil/${p?.username}`} onClick={e => shouldBlur && e.preventDefault()}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link href={`/profil/${p?.username}`} className="hover:underline">
                            <span className="text-sm font-semibold text-fg">
                              {p?.display_name || p?.username || 'Kullanıcı'}
                            </span>
                          </Link>
                          {userTier && <span className={`text-xs ${userTier.color}`}>{userTier.emoji}</span>}
                          {isOwn && <span className="text-xs bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">Sen</span>}
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
                        <p className="text-sm text-fg-muted leading-relaxed">{a.content}</p>
                        {!isOwn && !shouldBlur && userAnswer && p?.id && (
                          <button
                            onClick={() => challengeFromAnswer(p.id, p.username)}
                            className="mt-2 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                          >
                            <Swords size={10} />
                            Meydan Oku
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {shouldBlur && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-[3px]">
                      <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-1.5 shadow-sm">
                        <Lock size={12} className="text-violet-400" />
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
              className="mt-2 w-full text-center text-xs text-violet-400 hover:text-violet-300 font-semibold py-2.5 border border-dashed border-violet-500/30 rounded-xl transition-colors"
            >
              +{communityAnswers.length - 2} cevap daha — katılınca gör →
            </button>
          )}
        </div>
      )}

      {/* ── Recent duels feed ── */}
      {recentDuels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-fg">Son Düellolar</h2>
            <Link href="/liderlik" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
              Liderlik →
            </Link>
          </div>
          <div className="space-y-px rounded-2xl overflow-hidden border border-stroke">
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
          <Link href={`/profil/${profile.username}`} className="text-xs text-fg-subtle hover:text-violet-400 transition-colors shrink-0 font-medium">
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
                className="w-full bg-bg border border-stroke rounded-xl pl-9 pr-4 py-2.5 text-fg placeholder-fg-subtle focus:outline-none focus:border-violet-500/50 text-sm"
              />
            </div>
            {searchLoading && (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {searchResults.map(user => {
                  const userTier = getTier((user as any).total_points ?? 0)
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-stroke hover:border-violet-500/30 transition-colors">
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
