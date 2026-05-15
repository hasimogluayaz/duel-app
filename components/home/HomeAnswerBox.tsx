'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ChevronUp, Share2, Check, Flame } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface AnswerProfile {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Answer {
  id: string
  content: string
  vote_count: number
  user_id: string | null
  created_at: string
  profiles: AnswerProfile | AnswerProfile[] | null
}

interface Props {
  scenarioId: string
  userId: string | null
  streakCount?: number
  existingAnswerId?: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa`
  return `${Math.floor(h / 24)}g`
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// ── Countdown hook ─────────────────────────────────────────────────────────

function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    function tick() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.max(0, midnight.getTime() - now.getTime())
      setTime({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

// ── Component ──────────────────────────────────────────────────────────────

export function HomeAnswerBox({
  scenarioId,
  userId,
  streakCount = 0,
  existingAnswerId = null,
}: Props) {
  const supabase = createClient()
  const countdown = useCountdown()

  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'input' | 'submitted'>(
    existingAnswerId ? 'submitted' : 'input'
  )
  const [myAnswerId, setMyAnswerId] = useState<string | null>(existingAnswerId)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const [linkCopied, setLinkCopied] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const modalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchAnswers = useCallback(async () => {
    const { data } = await supabase
      .from('answers')
      .select('id, content, vote_count, user_id, created_at, profiles:profiles(username, display_name, avatar_url)')
      .eq('scenario_id', scenarioId)
      .order('vote_count', { ascending: false })
      .limit(30)
    setAnswers((data ?? []) as Answer[])
  }, [scenarioId, supabase])

  // Fetch answers when already in submitted phase (e.g. page refresh)
  useEffect(() => {
    if (phase === 'submitted') fetchAnswers()
  }, [phase, fetchAnswers])

  // Auto-submit pending localStorage response after registration/login
  useEffect(() => {
    if (!userId) return
    const pending = localStorage.getItem('kapisio_pending_response')
    const pendingScenarioId = localStorage.getItem('kapisio_pending_scenario_id')
    if (pending && pendingScenarioId === scenarioId && phase === 'input') {
      localStorage.removeItem('kapisio_pending_response')
      localStorage.removeItem('kapisio_pending_scenario_id')
      void doSubmit(pending, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, scenarioId])

  // Realtime vote updates
  useEffect(() => {
    if (phase !== 'submitted') return
    const ch = supabase
      .channel(`home-answers-${scenarioId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
        filter: `scenario_id=eq.${scenarioId}`,
      }, () => fetchAnswers())
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [phase, scenarioId, supabase, fetchAnswers])

  // Cleanup modal timer
  useEffect(() => () => { if (modalTimer.current) clearTimeout(modalTimer.current) }, [])

  async function doSubmit(content: string, isAuth: boolean) {
    setLoading(true)
    try {
      const endpoint = isAuth ? '/api/answer' : '/api/answer/anonymous'
      const body = isAuth
        ? { scenario_id: scenarioId, content, mode: 'scenario' }
        : { scenario_id: scenarioId, content }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { answer?: { id: string }; error?: string }

      if (!res.ok) {
        showToast(data.error ?? 'Bir hata oluştu.', false)
        return
      }
      if (data.answer) {
        setMyAnswerId(data.answer.id)
        setPhase('submitted')
        showToast('✓ Cevabın gönderildi')
        await fetchAnswers()
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit() {
    if (text.length < 10 || loading) return
    if (userId) {
      void doSubmit(text, true)
    } else {
      localStorage.setItem('kapisio_pending_response', text)
      localStorage.setItem('kapisio_pending_scenario_id', scenarioId)
      modalTimer.current = setTimeout(() => setShowStreakModal(true), 600)
    }
  }

  async function handleAnonymousSubmit() {
    setShowStreakModal(false)
    await doSubmit(text, false)
  }

  async function handleVote(answerId: string, answerUserId: string | null) {
    if (!userId) {
      setShowStreakModal(true)
      return
    }
    if (answerUserId === userId || votedIds.has(answerId)) return

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      setVotedIds(prev => new Set([...prev, answerId]))
      setAnswers(prev =>
        prev.map(a => a.id === answerId ? { ...a, vote_count: a.vote_count + 1 } : a)
      )
    } catch {}
  }

  async function handleShare() {
    const myAns = answers.find(a => a.id === myAnswerId)
    const voteCount = myAns?.vote_count ?? 0
    const shareText = `Bugünkü Kapisio senaryosuna ${voteCount} oy aldım. Sen ne yapardın? kapisio.com`
    try {
      await navigator.clipboard.writeText(shareText)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 2000)
    } catch {}
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText('https://kapisio.com')
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {}
  }

  const myAnswer = answers.find(a => a.id === myAnswerId)
  const otherAnswers = answers.filter(a => a.id !== myAnswerId)

  // ── Toast ────────────────────────────────────────────────────────────────

  const ToastEl = toast ? (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg pointer-events-none ${
      toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {toast.msg}
    </div>
  ) : null

  // ── Streak modal (shared between input + submitted phases) ────────────────

  const StreakModal = (
    <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Flame size={28} className="text-orange-500" />
        </div>
        <h2 className="text-lg font-black text-fg text-center">Streak&apos;ini başlatalım mı?</h2>
        <p className="text-sm text-fg-muted text-center leading-relaxed">
          Hesap oluşturursan her gün cevabını kaydeder,<br />
          art arda kaç gün geldiğini sayarız.{' '}
          <span className="text-fg-subtle">Ücretsiz, 10 saniye.</span>
        </p>
        <Link href={`/kayit?answer=${encodeURIComponent(text)}`} className="w-full">
          <Button className="w-full btn-gradient" size="lg">
            Ücretsiz hesap oluştur
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full text-fg-subtle"
          onClick={phase === 'input' ? handleAnonymousSubmit : () => setShowStreakModal(false)}
          disabled={loading}
        >
          Şimdi değil
        </Button>
      </div>
    </Modal>
  )

  // ── Submitted phase ───────────────────────────────────────────────────────

  if (phase === 'submitted') {
    return (
      <>
        {ToastEl}
        {StreakModal}

        <div className="flex flex-col gap-4">
          {/* Own answer */}
          {myAnswer && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full tracking-wide">
                  SEN
                </span>
                <span className="text-xs text-fg-subtle">{myAnswer.vote_count} oy</span>
              </div>
              <p className="text-sm text-fg leading-relaxed">{myAnswer.content}</p>
            </div>
          )}

          {/* Countdown card */}
          <div
            className="rounded-2xl p-5 text-white text-center"
            style={{ background: 'var(--k-navy-500, #1c2f6e)' }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase mb-3 opacity-60">
              ⏱ Yarınki Senaryo
            </p>
            <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
              {pad(countdown.h)} sa : {pad(countdown.m)} dk : {pad(countdown.s)} sn
            </div>
          </div>

          {/* Stats row */}
          {userId ? (
            <div className="flex items-center justify-center gap-5 text-sm text-fg-muted py-0.5">
              {myAnswer && (
                <span className="flex items-center gap-1.5">
                  <ChevronUp size={15} className="text-primary" />
                  <span className="font-bold text-fg">{myAnswer.vote_count}</span> oy
                </span>
              )}
              {streakCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  <span className="font-bold text-fg">{streakCount}</span> gün seri
                </span>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-fg-muted">
              Streak başlatmak ister misin?{' '}
              <Link href="/kayit" className="text-primary font-semibold hover:underline">
                Hesap oluştur →
              </Link>
            </p>
          )}

          {/* Share */}
          <Button onClick={handleShare} className="w-full btn-gradient" size="lg">
            {shareState === 'copied' ? (
              <><Check size={16} /> Kopyalandı ✓</>
            ) : (
              <><Share2 size={16} /> Sonucumu paylaş</>
            )}
          </Button>

          {/* Other answers */}
          {otherAnswers.length > 0 && (
            <div className="mt-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-fg">Diğer cevaplar</h3>
                <span className="text-xs text-fg-subtle bg-surface-2 px-2 py-0.5 rounded-full">
                  {otherAnswers.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {otherAnswers.map(answer => {
                  const prof = Array.isArray(answer.profiles) ? answer.profiles[0] : answer.profiles
                  const displayName = prof?.display_name ?? prof?.username ?? 'Anonim'
                  const username = prof?.username ?? ''
                  const voted = votedIds.has(answer.id)
                  const isOwn = answer.user_id === userId

                  return (
                    <div
                      key={answer.id}
                      className="rounded-xl border border-stroke bg-surface p-4 flex gap-3"
                    >
                      {/* Vote column */}
                      <button
                        onClick={() => handleVote(answer.id, answer.user_id)}
                        disabled={isOwn}
                        className={`flex flex-col items-center gap-1 min-w-[44px] py-1.5 px-1 rounded-xl transition-colors shrink-0 ${
                          voted
                            ? 'text-primary bg-primary/10'
                            : 'text-fg-subtle hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                        aria-label="Oy ver"
                      >
                        <ChevronUp size={18} />
                        <span className="text-base font-black leading-none">{answer.vote_count}</span>
                      </button>

                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {prof?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prof.avatar_url}
                              alt={displayName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(displayName)}`}
                            >
                              {initials(displayName)}
                            </div>
                          )}
                          <div className="min-w-0 flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-semibold text-fg truncate">{displayName}</span>
                            {username && (
                              <span className="text-xs text-fg-subtle">@{username}</span>
                            )}
                            <span className="text-xs text-fg-subtle">·</span>
                            <span className="text-xs text-fg-subtle">{timeAgo(answer.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-fg-muted leading-relaxed">{answer.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Arkadaşını çağır */}
          <div className="rounded-2xl border border-stroke bg-surface p-5 text-center mt-1">
            <h3 className="text-base font-bold text-fg mb-1">Arkadaşını çağır</h3>
            <p className="text-xs text-fg-muted mb-4">
              Aynı senaryoyu birlikte cevaplayın, karşılaştırın.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <a
                href="https://wa.me/?text=Bugünkü%20Kapisio%20senaryosuna%20bak%3A%20https%3A%2F%2Fkapisio.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#25D366] hover:bg-[#1fbd5a] text-white border-transparent"
                >
                  <Share2 size={13} />
                  WhatsApp
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="gap-1.5"
              >
                {linkCopied ? <><Check size={13} /> Kopyalandı ✓</> : 'Linki kopyala'}
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Input phase ───────────────────────────────────────────────────────────

  return (
    <>
      {ToastEl}
      {StreakModal}

      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, 280))}
          placeholder="Açık konuş, hepimiz aynı durumdayız."
          rows={4}
          className="w-full rounded-xl border border-stroke bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-subtle resize-none focus:outline-none focus:border-primary/50 transition-colors"
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs ${text.length > 260 ? 'text-orange-400' : 'text-fg-subtle'}`}>
            {text.length}/280
          </span>
          <Button
            onClick={handleSubmit}
            disabled={text.length < 10 || loading}
            className="btn-gradient"
            size="sm"
          >
            {loading ? 'Gönderiliyor…' : 'Gönder'}
          </Button>
        </div>
      </div>
    </>
  )
}
