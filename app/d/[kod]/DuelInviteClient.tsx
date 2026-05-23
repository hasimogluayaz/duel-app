'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronUp, Send, Swords, Share2, Flame, Copy, Check, Clock, Users, Bot, Sparkles } from 'lucide-react'

const MAX_PARTICIPANTS = 4

interface Profile { id: string; username: string; display_name: string | null; avatar_url: string | null }
interface Answer  { id: string; content: string; vote_count: number }

interface Participant {
  id: string
  user_id: string | null
  answer_id: string | null
  joined_at: string
  profile: Profile | null
  answer: Answer | null
}

interface Props {
  duel: { id: string; code: string; scenario_id: string; creator_id: string; judge_mode?: string; ai_verdict?: string | null; winner_id?: string | null }
  scenario: { id: string; content: string; active_date: string } | null
  creator: Profile | null
  participants: Participant[]
  currentUserId: string | null
}

export default function DuelInviteClient({ duel, scenario, creator, participants: initParticipants, currentUserId }: Props) {
  const supabase = createClient()

  const [participants, setParticipants] = useState<Participant[]>(initParticipants)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [votedAnswerIds, setVotedAnswerIds] = useState<Set<string>>(new Set())
  const [aiVerdict, setAiVerdict] = useState<string | null>(duel.ai_verdict ?? null)
  const [aiWinnerId, setAiWinnerId] = useState<string | null>(duel.winner_id ?? null)
  const [aiJudging, setAiJudging] = useState(false)

  const isAiMode = duel.judge_mode === 'ai'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kapisio.com'
  const duelUrl = `${appUrl}/d/${duel.code}`
  const isExpired = scenario ? scenario.active_date !== new Date().toISOString().split('T')[0] : true
  const isCreator = currentUserId === duel.creator_id
  const isFull = participants.length >= MAX_PARTICIPANTS
  const myParticipant = participants.find(p => p.user_id === currentUserId)
  const hasAnswered = !!myParticipant
  const creatorName = creator?.display_name || creator?.username || '?'

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Realtime: refresh vote_counts on answers table
  useEffect(() => {
    const ch = supabase
      .channel(`invite-${duel.code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'answers' }, (payload) => {
        const updated = payload.new as { id: string; vote_count: number }
        setParticipants(prev =>
          prev.map(p =>
            p.answer?.id === updated.id
              ? { ...p, answer: { ...p.answer!, vote_count: updated.vote_count } }
              : p
          )
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duel_participants', filter: `duel_id=eq.${duel.id}` },
        async () => {
          // Refresh participant list when someone new joins
          const { data } = await supabase
            .from('duel_participants')
            .select('id, user_id, answer_id, joined_at, profile:profiles(id, username, display_name, avatar_url), answer:answers(id, content, vote_count)')
            .eq('duel_id', duel.id)
            .order('joined_at', { ascending: true })
          if (data) setParticipants(data as Participant[])
        }
      )
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel.id, duel.code])

  async function handleSubmit() {
    if (text.trim().length < 10 || loading) return
    if (!currentUserId) { setShowStreakModal(true); return }
    await doSubmit(true)
  }

  async function doSubmit(isAuth: boolean) {
    setLoading(true)
    try {
      // 1. Submit answer
      const endpoint = isAuth ? '/api/answer' : '/api/answer/anonymous'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: duel.scenario_id, content: text.trim(), mode: 'scenario' }),
      })
      const data = await res.json() as { answer?: Answer; error?: string }
      if (!res.ok) { showToast(data.error ?? 'Bir hata oluştu.'); return }
      if (!data.answer) return

      // 2. Join the invite duel (only for authenticated users)
      if (isAuth && currentUserId) {
        await fetch(`/api/duel/${duel.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer_id: data.answer.id }),
        })
      }

      // 3. Optimistically add self to participants list
      const newEntry: Participant = {
        id: crypto.randomUUID(),
        user_id: currentUserId,
        answer_id: data.answer.id,
        joined_at: new Date().toISOString(),
        profile: null, // will be refreshed via realtime
        answer: data.answer,
      }
      setParticipants(prev => [...prev, newEntry])
      setText('')
      showToast('Cevabın gönderildi! 🎉')
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(answerId: string) {
    if (!currentUserId) return
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      const data = await res.json() as { toggled?: string }
      // Optimistic UI: toggle voted state
      setVotedAnswerIds(prev => {
        const next = new Set(prev)
        if (data.toggled === 'off') next.delete(answerId)
        else next.add(answerId)
        return next
      })
      // Optimistic vote count update
      setParticipants(prev =>
        prev.map(p =>
          p.answer?.id === answerId
            ? { ...p, answer: { ...p.answer!, vote_count: p.answer!.vote_count + (data.toggled === 'off' ? -1 : 1) } }
            : p
        )
      )
    } catch {}
  }

  async function requestAiJudge() {
    if (aiJudging || participants.length < 2) return
    setAiJudging(true)
    try {
      const res = await fetch(`/api/duel/${duel.id}/ai-judge`, { method: 'POST' })
      const data = await res.json() as { verdict?: string; winner_user_id?: string; error?: string }
      if (!res.ok) { showToast(data.error ?? 'AI karar veremedi.'); return }
      setAiVerdict(data.verdict ?? null)
      setAiWinnerId(data.winner_user_id ?? null)
      showToast('🤖 AI kararını verdi!')
    } catch {
      showToast('Bağlantı hatası.')
    } finally {
      setAiJudging(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(duelUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(
    `${creatorName} seni Kapisio düellosuna çağırdı! Aynı senaryoyu cevapla, topluluk kimin haklı olduğuna karar versin 👉 ${duelUrl}`
  )}`

  // Build 4 display slots (participants + empty placeholders)
  const emptySlots = MAX_PARTICIPANTS - participants.length
  const showAnswerForm = !isExpired && !hasAnswered && !isCreator && !isFull

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-50 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg pointer-events-none bg-[#e7f6ec] text-[#14532d] border border-[#16a34a]/20">
          {toast}
        </div>
      )}

      {/* Streak modal for anon */}
      <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-11 h-11 rounded-xl bg-warm-50 flex items-center justify-center">
            <Flame size={22} className="text-warm-500" />
          </div>
          <h2 className="text-lg font-bold text-fg text-center">Streak&apos;ini başlatalım mı?</h2>
          <p className="text-sm text-fg-muted text-center leading-relaxed">
            Hesap oluşturursan cevabın kaydedilir, streak sayılır.{' '}
            <span className="text-fg-subtle">Ücretsiz, 10 saniye.</span>
          </p>
          <Link href={`/kayit?answer=${encodeURIComponent(text)}`} className="w-full">
            <Button className="w-full btn-gradient" size="lg">Ücretsiz hesap oluştur</Button>
          </Link>
          <Button variant="ghost" className="w-full text-fg-subtle" onClick={() => { setShowStreakModal(false); void doSubmit(false) }} disabled={loading}>
            Şimdi değil, anonim gönder
          </Button>
        </div>
      </Modal>

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex items-center gap-2 text-fg-subtle text-xs font-semibold tracking-widest uppercase">
          <Swords size={14} className="text-primary" />
          KAPISIO DÜELLOSU
        </div>

        <div className="flex items-center gap-3">
          <Avatar src={creator?.avatar_url} username={creatorName} size="md" />
          <div>
            {isCreator ? (
              <>
                <p className="text-lg font-black text-fg tracking-tight">Düellon aktif!</p>
                <p className="text-sm text-fg-muted mt-0.5">Arkadaşlarını davet et, topluluk kimin haklı olduğuna karar versin</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black text-fg tracking-tight">
                  {creatorName} seni düelloya çağırdı
                </p>
                {!isExpired && (
                  <p className="text-sm text-fg-muted mt-0.5">Aynı senaryoyu cevapla, topluluk kimin haklı karar versin</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Participant counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted bg-surface-2 border border-stroke px-3 py-1.5 rounded-full">
            <Users size={12} className="text-primary" />
            <span>{participants.length}/{MAX_PARTICIPANTS} katılımcı</span>
          </div>
          {!isExpired && !isFull && (
            <div className="flex items-center gap-1 text-xs text-green-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Açık
            </div>
          )}
          {isFull && (
            <div className="text-xs font-semibold text-amber-500">Dolu</div>
          )}
        </div>
      </div>

      {/* ── Expired banner ───────────────────────────── */}
      {isExpired && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Bu düello süresi dolmuş</p>
          <p className="text-xs text-fg-muted">Düello linki sadece günün senaryosu için geçerlidir.</p>
          <Link href="/" className="text-xs font-semibold mt-2 inline-block" style={{ color: 'var(--primary)' }}>
            Bugünkü senaryoya git →
          </Link>
        </div>
      )}

      {/* ── Scenario card ────────────────────────────── */}
      {scenario && (
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}>
          <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest mb-2">DÜELLO SENARYOSU</p>
          <p className="text-[16px] text-fg leading-relaxed font-semibold">{scenario.content}</p>
        </div>
      )}

      {/* ── Creator share strip (only for creator) ───── */}
      {isCreator && !isExpired && !isFull && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary/80 text-center">
            Linki paylaş — {MAX_PARTICIPANTS - participants.length} boş yer kaldı
          </p>
          <div className="flex items-center gap-2 bg-bg border border-stroke rounded-xl px-3 py-2">
            <span className="text-xs text-fg-muted font-mono flex-1 truncate">{duelUrl}</span>
            <button onClick={handleCopy} className="shrink-0 text-primary hover:text-primary/70 transition-colors">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1fbd5a] text-white border-transparent" size="sm">
              <Share2 size={13} />
              WhatsApp&apos;a gönder
            </Button>
          </a>
        </div>
      )}

      {/* ── Participant cards grid ───────────────────── */}
      {!isExpired && (
        <div className="grid grid-cols-2 gap-3">

          {/* Filled participant slots */}
          {participants.map((p, i) => {
            const name = p.profile?.display_name || p.profile?.username || (i === 0 ? creatorName : `Katılımcı ${i + 1}`)
            const isMe = p.user_id === currentUserId
            const isThisCreator = p.user_id === duel.creator_id
            const totalVotes = participants.reduce((s, x) => s + (x.answer?.vote_count ?? 0), 0)
            const pct = totalVotes > 0 ? Math.round(((p.answer?.vote_count ?? 0) / totalVotes) * 100) : null
            const hasVotedThis = p.answer?.id ? votedAnswerIds.has(p.answer.id) : false
            const isAiWinner = !!aiWinnerId && p.user_id === aiWinnerId

            return (
              <div
                key={p.id}
                className="rounded-2xl p-4 border flex flex-col gap-3 relative"
                style={{
                  background: isAiWinner ? 'color-mix(in oklab, #f59e0b 8%, var(--surface))' : 'var(--surface)',
                  borderColor: isAiWinner
                    ? '#f59e0b'
                    : isMe
                    ? 'color-mix(in oklab, var(--primary) 35%, var(--stroke))'
                    : isThisCreator
                    ? 'color-mix(in oklab, var(--primary) 20%, var(--stroke))'
                    : 'var(--stroke)',
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-2">
                  <Avatar
                    src={isThisCreator ? creator?.avatar_url : p.profile?.avatar_url}
                    username={name}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-fg truncate block">{isMe ? 'Sen' : name}</span>
                    {(isThisCreator || isMe) && (
                      <span
                        className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color: 'var(--primary)', background: 'var(--k-blue-50, #eff6ff)' }}
                      >
                        {isThisCreator ? 'DAVET EDEN' : 'SEN'}
                      </span>
                    )}
                  </div>
                  {pct !== null && (
                    <span className="text-xs font-bold text-fg-subtle shrink-0">%{pct}</span>
                  )}
                </div>

                {/* AI winner badge */}
                {isAiWinner && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-black shadow flex items-center gap-1">
                      🏆 AI Kazananı
                    </span>
                  </div>
                )}

                {/* Answer text */}
                <p className="text-[14px] text-fg leading-relaxed flex-1">{p.answer?.content}</p>

                {/* Vote button — only in community mode */}
                {!isAiMode && (
                  <button
                    onClick={() => p.answer?.id && handleVote(p.answer.id)}
                    disabled={!currentUserId || isMe}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: hasVotedThis ? 'var(--primary)' : 'var(--surface-2)',
                      color: hasVotedThis ? '#fff' : 'var(--fg-subtle)',
                    }}
                  >
                    <ChevronUp size={14} />
                    {p.answer?.vote_count ?? 0} oy
                  </button>
                )}
              </div>
            )
          })}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => {
            const slotIndex = participants.length + i
            // First empty slot for an unanswered visitor → show form
            const showForm = i === 0 && showAnswerForm

            return (
              <div
                key={`empty-${i}`}
                className="rounded-2xl border flex flex-col gap-2 p-4"
                style={{
                  background: showForm ? 'var(--surface)' : 'var(--surface-2)',
                  borderColor: showForm
                    ? 'color-mix(in oklab, var(--primary) 30%, var(--stroke))'
                    : 'var(--stroke)',
                  minHeight: 150,
                }}
              >
                {showForm ? (
                  <>
                    <p className="text-[13px] font-semibold text-fg">Sen ne yapardın?</p>
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value.slice(0, 280))}
                      placeholder="Cevabını yaz ve düelloya katıl"
                      rows={3}
                      className="w-full resize-none rounded-xl border text-sm text-fg placeholder:text-fg-subtle outline-none"
                      style={{ padding: '10px 12px', background: 'var(--surface-2)', borderColor: 'var(--stroke)' }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle tabular-nums">{text.trim().length}/280</span>
                      <Button
                        onClick={handleSubmit}
                        disabled={text.trim().length < 10 || loading}
                        className="btn-gradient gap-1.5 text-xs h-8 px-4"
                      >
                        {loading ? 'Gönderiliyor…' : <><Send size={12} />Gönder</>}
                      </Button>
                    </div>
                  </>
                ) : isCreator ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-stroke flex items-center justify-center">
                      <span className="text-lg text-fg-subtle">?</span>
                    </div>
                    <p className="text-xs text-fg-subtle">Boş yer</p>
                    <p className="text-[11px] text-fg-subtle/60">Linki paylaşarak doldurun</p>
                  </div>
                ) : hasAnswered ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
                    <Clock size={18} className="text-fg-subtle/50" />
                    <p className="text-xs text-fg-subtle">Bekleniyor…</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
                    <Clock size={18} className="text-fg-subtle/50" />
                    <p className="text-xs text-fg-subtle">Bekleniyor…</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Full notice ──────────────────────────────── */}
      {!isExpired && isFull && !hasAnswered && !isCreator && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Bu düello doldu (4/4)</p>
          <p className="text-xs text-fg-muted mt-1">Başka bir düelloya katılmak için ana sayfaya git.</p>
        </div>
      )}

      {/* ── Already answered notice ──────────────────── */}
      {hasAnswered && !isCreator && (
        <div className="text-center text-xs text-fg-subtle flex items-center justify-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px]">✓</span>
          Cevabın kaydedildi — yeni katılımcılar gelince puanlar güncellenecek
        </div>
      )}

      {/* ── AI Verdict ───────────────────────────────── */}
      {isAiMode && !isExpired && (
        <div>
          {aiVerdict ? (
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Bot size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-400">AI Kararı</p>
                  <p className="text-xs text-fg-subtle">Yapay zeka hakemliği</p>
                </div>
              </div>
              <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{aiVerdict}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col items-center gap-3 text-center">
              <Bot size={24} className="text-amber-400" />
              <div>
                <p className="text-sm font-bold text-fg">Yapay Zeka Modu</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {participants.length < 2
                    ? 'En az 2 cevap olunca AI karar verebilir'
                    : isCreator
                    ? 'Cevaplar hazır — AI karar versin'
                    : 'Kurucu AI\'dan karar isteyebilir'}
                </p>
              </div>
              {isCreator && (
                <Button
                  onClick={requestAiJudge}
                  loading={aiJudging}
                  disabled={participants.length < 2}
                  className="gap-2"
                  style={{ background: '#f59e0b', color: '#000', border: 'none' }}
                >
                  <Sparkles size={15} />
                  {aiJudging ? 'AI düşünüyor…' : 'AI Karar Versin'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom CTAs ──────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Link href="/">
          <Button className="w-full btn-gradient">Sen de bugünkü senaryoya katıl →</Button>
        </Link>
        {participants.length >= 2 && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1fbd5a] text-white border-transparent" size="lg">
              <Share2 size={16} />
              Sonucu WhatsApp&apos;tan paylaş
            </Button>
          </a>
        )}
      </div>

    </div>
  )
}
