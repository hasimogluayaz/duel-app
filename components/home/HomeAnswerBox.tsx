'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  ChevronUp, Share2, Check, Flame, Trophy, Clock, Copy, Send
} from 'lucide-react'

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
  '#3b82f6', '#8b5cf6', '#22c55e', '#f97316',
  '#ec4899', '#14b8a6', '#6366f1', '#f43f5e',
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
  const [anonAnsweredToday, setAnonAnsweredToday] = useState(false)
  const [clientReady, setClientReady] = useState(!!existingAnswerId || !!userId)

  const wasAlreadyAnswered = useRef(existingAnswerId !== null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(120, el.scrollHeight) + 'px'
  }, [text])

  const fetchAnswers = useCallback(async () => {
    const { data } = await supabase
      .from('answers')
      .select('id, content, vote_count, user_id, created_at, profiles:profiles(username, display_name, avatar_url)')
      .eq('scenario_id', scenarioId)
      .order('vote_count', { ascending: false })
      .limit(30)
    setAnswers((data ?? []) as Answer[])
  }, [scenarioId, supabase])

  useEffect(() => {
    if (phase === 'submitted') fetchAnswers()
  }, [phase, fetchAnswers])

  // Load existing votes on mount
  useEffect(() => {
    if (phase !== 'submitted') return
    if (userId) {
      // Fetch from DB
      supabase
        .from('answer_likes')
        .select('answer_id')
        .eq('user_id', userId)
        .then(({ data }) => {
          if (data) setVotedIds(new Set(data.map((d: { answer_id: string }) => d.answer_id)))
        })
    } else {
      // Load from localStorage
      try {
        const stored = localStorage.getItem('kapisio_votes')
        if (stored) setVotedIds(new Set(JSON.parse(stored) as string[]))
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, userId])

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

  // Anon already-answered check (on refresh: localStorage key still set, no userId)
  useEffect(() => {
    if (userId) return
    const pendingScenarioId = localStorage.getItem('kapisio_pending_scenario_id')
    if (pendingScenarioId === scenarioId) setAnonAnsweredToday(true)
    setClientReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId])

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
    if (answerUserId === userId && userId) return // can't vote own answer

    // Anon user: use localStorage
    if (!userId) {
      if (votedIds.has(answerId)) return // anon can't toggle off
      // Save to localStorage
      const newVoted = new Set(votedIds)
      newVoted.add(answerId)
      setVotedIds(newVoted)
      try { localStorage.setItem('kapisio_votes', JSON.stringify([...newVoted])) } catch {}
      setAnswers(prev =>
        prev.map(a => a.id === answerId ? { ...a, vote_count: a.vote_count + 1 } : a)
      )
      return
    }

    const alreadyVoted = votedIds.has(answerId)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      const data = await res.json() as { toggled?: string }

      if (data.toggled === 'off') {
        // Removed vote
        setVotedIds(prev => { const s = new Set(prev); s.delete(answerId); return s })
        setAnswers(prev =>
          prev.map(a => a.id === answerId ? { ...a, vote_count: Math.max(0, a.vote_count - 1) } : a)
        )
      } else {
        // Added vote
        setVotedIds(prev => { const s = new Set(prev); s.add(answerId); return s })
        if (!alreadyVoted) {
          setAnswers(prev =>
            prev.map(a => a.id === answerId ? { ...a, vote_count: a.vote_count + 1 } : a)
          )
        }
      }
    } catch {}
  }

  // Percentile: % of answers with fewer votes than mine
  const myPercentile = useMemo(() => {
    const myAns = answers.find(a => a.id === myAnswerId)
    if (!myAns || answers.length < 2) return null
    const myVotes = myAns.vote_count
    const below = answers.filter(a => a.id !== myAnswerId && a.vote_count < myVotes).length
    const others = answers.length - 1
    if (others === 0) return null
    return Math.max(1, Math.round((below / others) * 100))
  }, [answers, myAnswerId])

  async function handleShare() {
    const myAns = answers.find(a => a.id === myAnswerId)
    const voteCount = myAns?.vote_count ?? 0
    const percentText = myPercentile ? `, top %${myPercentile}'teyim` : ''
    const shareText = `Bugünkü Kapisio senaryosuna ${voteCount} oy aldım${percentText}. Sen ne yapardın? kapisio.com`
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
  const charCount = text.trim().length
  const canSubmit = charCount >= 10

  // ── Toast ────────────────────────────────────────────────────────────────

  const ToastEl = toast ? (
    <div className={`fixed top-[70px] left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg pointer-events-none ${
      toast.ok
        ? 'bg-[#e7f6ec] text-[#14532d] border border-[#16a34a]/20'
        : 'bg-red-50 text-red-900 border border-red-200'
    }`}>
      {toast.ok && <Check size={14} className="text-[#16a34a]" />}
      {toast.msg}
    </div>
  ) : null

  // ── Streak modal ─────────────────────────────────────────────────────────

  const StreakModal = (
    <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-11 h-11 rounded-xl bg-warm-50 flex items-center justify-center">
          <Flame size={22} className="text-warm-500" />
        </div>
        <h2 className="text-lg font-bold text-fg text-center tracking-tight">Streak&apos;ini başlatalım mı?</h2>
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

        <div className="flex flex-col gap-4 animate-slide-up">

          {/* Already-answered notice (shown when user already had an answer on page load) */}
          {wasAlreadyAnswered.current && (
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              style={{ background: 'var(--k-green-50, #e7f6ec)', color: '#15803d' }}
            >
              <Check size={14} className="shrink-0" style={{ color: '#16a34a' }} />
              Bugün zaten cevap verdin ✓
            </div>
          )}

          {/* Own answer card */}
          {myAnswer && (
            <div
              className="rounded-2xl p-4 border"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--k-blue-100)',
                boxShadow: '0 0 0 4px rgba(42,108,240,0.06)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: '#2a6cf0' }}
                >
                  {userId ? 'SN' : 'MS'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-fg">Sen</span>
                    <span
                      className="text-[9.5px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                      style={{ color: 'var(--primary)', background: 'var(--k-blue-50)' }}
                    >
                      SEN
                    </span>
                  </div>
                  <div className="text-[11px] text-fg-subtle">şimdi</div>
                </div>
              </div>
              <p className="text-[14.5px] text-fg leading-relaxed">{myAnswer.content}</p>
            </div>
          )}

          {/* Countdown card */}
          <div
            className="rounded-2xl p-5 text-white text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0f1320 0%, #1a2348 100%)',
              boxShadow: '0 12px 32px -16px rgba(15,19,32,.18), 0 4px 8px -4px rgba(15,19,32,.05)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 20% 30%, rgba(42,108,240,0.3), transparent 50%), radial-gradient(circle at 80% 70%, rgba(81,136,250,0.25), transparent 50%)',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.65)' }}>
                <Clock size={13} />
                <span>Yarınki senaryo</span>
              </div>
              <div className="flex items-baseline justify-center gap-1.5 tabular-nums">
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-[44px] sm:text-[54px] font-extrabold leading-none tracking-tight">{pad(countdown.h)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>sa</span>
                </span>
                <span className="text-[32px] sm:text-[40px] font-light" style={{ color: 'rgba(255,255,255,0.3)', margin: '0 -2px' }}>:</span>
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-[44px] sm:text-[54px] font-extrabold leading-none tracking-tight">{pad(countdown.m)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>dk</span>
                </span>
                <span className="text-[32px] sm:text-[40px] font-light" style={{ color: 'rgba(255,255,255,0.3)', margin: '0 -2px' }}>:</span>
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-[44px] sm:text-[54px] font-extrabold leading-none tracking-tight">{pad(countdown.s)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>sn</span>
                </span>
              </div>
              <p className="mt-3 text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {userId ? (
                  'Cevabın kaydedildi. Yarın da gel, serin kopmasın.'
                ) : (
                  <>
                    Streak başlatmak ister misin?{' '}
                    <Link href="/kayit" className="font-semibold" style={{ color: 'rgba(129,180,255,0.9)' }}>
                      Hesap oluştur →
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Stats row (logged-in) or anon CTA */}
          {userId ? (
            <>
              <div
                className="flex items-stretch rounded-2xl border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--stroke)',
                  padding: '12px 4px',
                }}
              >
                {/* Votes */}
                <div className="flex-1 flex items-center gap-2.5 px-3 py-1 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--k-blue-50)', color: 'var(--primary)' }}
                  >
                    <ChevronUp size={14} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-fg leading-none tabular-nums">{myAnswer?.vote_count ?? 0}</div>
                    <div className="text-[11px] text-fg-subtle mt-0.5">oy aldın</div>
                  </div>
                </div>
                <div className="w-px my-1.5" style={{ background: 'var(--stroke)' }} />
                {/* Percentile */}
                <div className="flex-1 flex items-center gap-2.5 px-3 py-1 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#fff7e6', color: '#d97706' }}
                  >
                    <Trophy size={13} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-fg leading-none tabular-nums">
                      {myPercentile ? `Top %${myPercentile}` : '—'}
                    </div>
                    <div className="text-[11px] text-fg-subtle mt-0.5">içindesin</div>
                  </div>
                </div>
                <div className="w-px my-1.5" style={{ background: 'var(--stroke)' }} />
                {/* Streak */}
                <div className="flex-1 flex items-center gap-2.5 px-3 py-1 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(237,111,28,0.12)', color: '#ed6f1c' }}
                  >
                    <Flame size={13} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-fg leading-none tabular-nums">{streakCount} gün</div>
                    <div className="text-[11px] text-fg-subtle mt-0.5">seri</div>
                  </div>
                </div>
              </div>

              {/* Share result */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition-colors py-3.5 px-5"
                style={{
                  background: 'var(--primary)',
                  boxShadow: '0 1px 0 rgba(20,66,168,.6) inset, 0 4px 12px -4px rgba(42,108,240,0.45)',
                }}
              >
                {shareState === 'copied' ? <Check size={16} /> : <Share2 size={16} />}
                {shareState === 'copied' ? 'Metin kopyalandı' : 'Sonucumu paylaş'}
              </button>
            </>
          ) : (
            <div
              className="rounded-2xl border px-5 py-4 flex flex-col items-center gap-2 text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
            >
              <p className="text-sm text-fg-muted">Streak başlatmak ister misin?</p>
              <Link
                href="/kayit"
                className="text-sm font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Hesap oluştur →
              </Link>
            </div>
          )}

          {/* Other answers */}
          {otherAnswers.length > 0 && (
            <div className="mt-1">
              <div className="flex items-baseline justify-between mb-3 px-0.5">
                <h2 className="text-base font-bold text-fg tracking-tight">Diğer cevaplar</h2>
                <span className="text-xs text-fg-subtle font-medium tabular-nums">{otherAnswers.length}</span>
              </div>
              <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
                {otherAnswers.map(answer => {
                  const prof = Array.isArray(answer.profiles) ? answer.profiles[0] : answer.profiles
                  const displayName = prof?.display_name ?? prof?.username ?? 'Anonim'
                  const username = prof?.username ?? ''
                  const voted = votedIds.has(answer.id)
                  const isOwn = answer.user_id === userId
                  const color = avatarColor(displayName)

                  return (
                    <li
                      key={answer.id}
                      className="flex gap-2.5 rounded-2xl border p-3.5 transition-colors"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--stroke)',
                      }}
                    >
                      {/* Vote column */}
                      <button
                        onClick={() => handleVote(answer.id, answer.user_id)}
                        disabled={isOwn}
                        aria-label="Oy ver"
                        className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          width: 38,
                          background: voted ? 'var(--primary)' : 'var(--surface-2)',
                          color: voted ? '#fff' : 'var(--fg-subtle)',
                          border: voted ? '1px solid var(--primary)' : '1px solid transparent',
                        }}
                      >
                        <ChevronUp size={16} />
                        <span className="text-[12px] font-bold leading-none tabular-nums">{answer.vote_count}</span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {prof?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prof.avatar_url}
                              alt={displayName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                              style={{ background: color }}
                            >
                              {initials(displayName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-fg">{displayName}</div>
                            <div className="text-[11px] text-fg-subtle">
                              {username && `@${username} · `}{timeAgo(answer.created_at)}
                            </div>
                          </div>
                        </div>
                        <p className="text-[14.5px] text-fg leading-relaxed m-0">{answer.content}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Arkadaşını çağır */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3.5 mt-1"
            style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
          >
            <div>
              <h3 className="text-[15px] font-bold text-fg">Arkadaşını çağır</h3>
              <p className="text-[13px] text-fg-subtle mt-0.5">Aynı senaryoyu birlikte cevaplayın, karşılaştırın.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Bugünün Kapisio senaryosuna bak: kapisio.com')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <button
                  className="w-full flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white py-3 transition-colors"
                  style={{ background: '#25D366' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp&apos;tan gönder
                </button>
              </a>
              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold py-3 border transition-colors"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--primary)',
                  borderColor: 'color-mix(in oklab, var(--primary) 28%, var(--stroke))',
                }}
                onClick={handleCopyLink}
              >
                {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                {linkCopied ? 'Kopyalandı ✓' : 'Linki kopyala'}
              </button>
            </div>
          </div>

        </div>
      </>
    )
  }

  // ── Anon already-answered phase ──────────────────────────────────────────

  if (anonAnsweredToday && !userId) {
    return (
      <>
        {ToastEl}
        <div
          className="rounded-2xl border p-5 flex flex-col gap-3 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--k-blue-50)', color: 'var(--primary)' }}>
            <Check size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-fg mb-1">Bugün anonim cevap verdin</p>
            <p className="text-xs text-fg-muted leading-relaxed">
              Hesap oluşturursan cevabın kaydedilir, streak sayılır.
            </p>
          </div>
          <Link href="/kayit" className="w-full">
            <Button className="w-full btn-gradient">Hesap oluştur, cevabını kaydet →</Button>
          </Link>
        </div>
      </>
    )
  }

  // ── Input phase ───────────────────────────────────────────────────────────

  // Prevent hydration flash: don't show textarea until client-side checks are done
  if (!clientReady) {
    return <div className="h-[160px]" />
  }

  return (
    <>
      {ToastEl}
      {StreakModal}

      <div className="flex flex-col gap-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 280))}
          placeholder="Açık konuş, hepimiz aynı durumdayız."
          className="w-full resize-none rounded-2xl border text-base text-fg placeholder:text-fg-subtle outline-none transition-all"
          style={{
            minHeight: 120,
            padding: '16px 18px',
            lineHeight: '1.5',
            background: 'var(--surface)',
            borderColor: 'var(--stroke)',
            borderWidth: '1.5px',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(42,108,240,0.12)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--stroke)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs font-semibold tabular-nums ${charCount > 260 ? 'text-warm-500' : 'text-fg-subtle'}`}
          >
            {charCount}/280
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-white px-5 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--primary)',
              boxShadow: canSubmit ? '0 1px 0 rgba(20,66,168,.6) inset, 0 4px 12px -4px rgba(42,108,240,0.45)' : 'none',
            }}
          >
            {loading ? 'Gönderiliyor…' : (
              <>Gönder <Send size={14} /></>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
