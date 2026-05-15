'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronUp, Send, Swords, Share2, Flame } from 'lucide-react'

interface Props {
  duel: { id: string; code: string; scenario_id: string; creator_id: string }
  scenario: { id: string; content: string; active_date: string } | null
  creator: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
  creatorAnswer: { id: string; content: string; vote_count: number; created_at: string } | null
  visitorAnswer: { id: string; content: string; vote_count: number } | null
  currentUserId: string | null
}

export default function DuelInviteClient({
  duel, scenario, creator, creatorAnswer, visitorAnswer, currentUserId,
}: Props) {
  const supabase = createClient()

  const [text, setText] = useState('')
  const [myAnswer, setMyAnswer] = useState(visitorAnswer)
  const [cVotes, setCVotes] = useState(creatorAnswer?.vote_count ?? 0)
  const [vVotes, setVVotes] = useState(visitorAnswer?.vote_count ?? 0)
  const [votedCreator, setVotedCreator] = useState(false)
  const [votedVisitor, setVotedVisitor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showStreakModal, setShowStreakModal] = useState(false)

  const creatorName = creator?.display_name || creator?.username || '?'
  const isOwnDuel = currentUserId === duel.creator_id
  const isExpired = scenario ? scenario.active_date !== new Date().toISOString().split('T')[0] : true

  const totalVotes = cVotes + vVotes
  const cPct = totalVotes > 0 ? Math.round((cVotes / totalVotes) * 100) : 50
  const vPct = 100 - cPct

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Realtime: refresh vote counts
  useEffect(() => {
    if (!creatorAnswer?.id) return
    const ids = [creatorAnswer.id, myAnswer?.id].filter(Boolean) as string[]
    const ch = supabase
      .channel(`duel-${duel.code}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
      }, (payload) => {
        const row = payload.new as { id: string; vote_count: number }
        if (row.id === creatorAnswer.id) setCVotes(row.vote_count)
        if (myAnswer?.id && row.id === myAnswer.id) setVVotes(row.vote_count)
      })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel.code, creatorAnswer?.id, myAnswer?.id])

  async function handleSubmit() {
    if (text.trim().length < 10 || loading) return

    // Anon: show streak modal first
    if (!currentUserId) {
      setShowStreakModal(true)
      return
    }

    await doSubmit(true)
  }

  async function doSubmit(isAuth: boolean) {
    setLoading(true)
    try {
      const endpoint = isAuth ? '/api/answer' : '/api/answer/anonymous'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: duel.scenario_id, content: text.trim(), mode: 'scenario' }),
      })
      const data = await res.json() as { answer?: { id: string; content: string; vote_count: number }; error?: string }
      if (!res.ok) { showToastMsg(data.error ?? 'Bir hata oluştu.'); return }
      if (data.answer) {
        setMyAnswer(data.answer)
        setVVotes(data.answer.vote_count)
        showToastMsg('Cevabın gönderildi!')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAnonSubmit() {
    setShowStreakModal(false)
    await doSubmit(false)
  }

  async function handleVote(forCreator: boolean) {
    if (!currentUserId) return
    const answerId = forCreator ? creatorAnswer?.id : myAnswer?.id
    if (!answerId) return

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      const data = await res.json() as { toggled?: string }
      if (data.toggled === 'off') {
        if (forCreator) { setCVotes(v => Math.max(0, v - 1)); setVotedCreator(false) }
        else { setVVotes(v => Math.max(0, v - 1)); setVotedVisitor(false) }
      } else {
        if (forCreator) { setCVotes(v => v + 1); setVotedCreator(true) }
        else { setVVotes(v => v + 1); setVotedVisitor(true) }
      }
    } catch {}
  }

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Kapisio düellosunda ${creatorName} vs Sen! Kim haklı? kapisio.com/d/${duel.code}`
  )}`

  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5">

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
          <h2 className="text-lg font-bold text-fg text-center tracking-tight">
            Streak&apos;ini başlatalım mı?
          </h2>
          <p className="text-sm text-fg-muted text-center leading-relaxed">
            Hesap oluşturursan cevabın kaydedilir, streak sayılır.{' '}
            <span className="text-fg-subtle">Ücretsiz, 10 saniye.</span>
          </p>
          <Link href={`/kayit?answer=${encodeURIComponent(text)}`} className="w-full">
            <Button className="w-full btn-gradient" size="lg">Ücretsiz hesap oluştur</Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full text-fg-subtle"
            onClick={handleAnonSubmit}
            disabled={loading}
          >
            Şimdi değil, anonim gönder
          </Button>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex items-center gap-2 text-fg-subtle text-xs font-semibold tracking-widest uppercase">
          <Swords size={14} className="text-primary" />
          KAPISIO DÜELLOSU
        </div>
        <div className="flex items-center gap-3">
          <Avatar src={creator?.avatar_url} username={creatorName} size="md" />
          <div>
            <p className="text-lg font-black text-fg tracking-tight">
              {creatorName} seni düelloya çağırdı
            </p>
            {!isOwnDuel && !isExpired && (
              <p className="text-sm text-fg-muted mt-0.5">Aynı senaryoyu sen de cevapla, topluluk kimin haklı olduğuna karar versin</p>
            )}
          </div>
        </div>
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
            Bu düello süresi dolmuş
          </p>
          <p className="text-xs text-fg-muted">Düello linki sadece günün senaryosu için geçerlidir.</p>
          <Link href="/" className="text-xs font-semibold mt-2 inline-block" style={{ color: 'var(--primary)' }}>
            Bugünkü senaryoya git →
          </Link>
        </div>
      )}

      {/* Scenario card */}
      {scenario && (
        <div
          className="rounded-2xl p-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
        >
          <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest mb-2">DÜELLO SENARYOSU</p>
          <p className="text-[16px] text-fg leading-relaxed font-semibold">{scenario.content}</p>
        </div>
      )}

      {/* Vote result bar */}
      {(creatorAnswer && myAnswer) && totalVotes > 0 && (
        <div
          className="rounded-2xl border p-4 flex flex-col gap-2.5"
          style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
        >
          <div className="flex justify-between text-xs font-bold">
            <span style={{ color: 'var(--primary)' }}>{creatorName} %{cPct}</span>
            <span className="text-fg-muted">Sen %{vPct}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${cPct}%`, background: 'var(--primary)' }}
            />
          </div>
          <p className="text-xs text-fg-subtle text-center font-medium">
            {cPct === vPct
              ? 'Oylar eşit! Topluluk karar veremedi 🤝'
              : `Topluluk %${Math.max(cPct, vPct)} ile ${cPct > vPct ? creatorName : 'seni'} tercih etti`}
          </p>
        </div>
      )}

      {/* Two-column answers */}
      {!isExpired && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Creator's answer */}
          {creatorAnswer ? (
            <div
              className="rounded-2xl p-4 border flex flex-col gap-3"
              style={{ background: 'var(--surface)', borderColor: 'color-mix(in oklab, var(--primary) 20%, var(--stroke))' }}
            >
              <div className="flex items-center gap-2">
                <Avatar src={creator?.avatar_url} username={creatorName} size="xs" />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-fg">{creatorName}</span>
                  <span
                    className="ml-1.5 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                    style={{ color: 'var(--primary)', background: 'var(--k-blue-50, #eff6ff)' }}
                  >
                    DAVET EDEN
                  </span>
                </div>
              </div>
              <p className="text-[14px] text-fg leading-relaxed flex-1">{creatorAnswer.content}</p>
              <button
                onClick={() => handleVote(true)}
                disabled={!currentUserId || isOwnDuel}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: votedCreator ? 'var(--primary)' : 'var(--surface-2)',
                  color: votedCreator ? '#fff' : 'var(--fg-subtle)',
                  border: votedCreator ? '1px solid var(--primary)' : '1px solid transparent',
                }}
              >
                <ChevronUp size={14} />
                {cVotes} oy
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl p-4 border flex items-center justify-center text-sm text-fg-muted text-center"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--stroke)', minHeight: 120 }}
            >
              Henüz cevap yok
            </div>
          )}

          {/* Visitor's answer */}
          {myAnswer ? (
            <div
              className="rounded-2xl p-4 border flex flex-col gap-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: '#2a6cf0' }}
                >
                  SN
                </div>
                <span className="text-[13px] font-semibold text-fg">
                  Sen
                  <span
                    className="ml-1.5 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                    style={{ color: 'var(--primary)', background: 'var(--k-blue-50, #eff6ff)' }}
                  >
                    SEN
                  </span>
                </span>
              </div>
              <p className="text-[14px] text-fg leading-relaxed flex-1">{myAnswer.content}</p>
              <button
                disabled
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold opacity-50 cursor-not-allowed"
                style={{ background: 'var(--surface-2)', color: 'var(--fg-subtle)' }}
              >
                <ChevronUp size={14} />
                {vVotes} oy
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl border flex flex-col gap-2 p-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
            >
              {isOwnDuel ? (
                <p className="text-sm text-fg-muted text-center py-4">
                  Arkadaşın henüz cevaplamamış.
                </p>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-fg">Sen ne yapardın?</p>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, 280))}
                    placeholder="Cevabını yaz ve düelloya katıl"
                    rows={4}
                    className="w-full resize-none rounded-xl border text-sm text-fg placeholder:text-fg-subtle outline-none"
                    style={{
                      padding: '10px 12px',
                      background: 'var(--surface-2)',
                      borderColor: 'var(--stroke)',
                    }}
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom CTAs */}
      <div className="flex flex-col gap-3">
        <Link href="/" className="w-full">
          <Button className="w-full btn-gradient">Sen de bugünkü senaryoya katıl →</Button>
        </Link>
        {(creatorAnswer && myAnswer) && (
          <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#1fbd5a] text-white border-transparent"
              size="lg"
            >
              <Share2 size={16} />
              Sonucu WhatsApp&apos;tan paylaş
            </Button>
          </a>
        )}
      </div>

    </div>
  )
}
