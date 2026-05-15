'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronUp, Send, Swords } from 'lucide-react'

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
  const [text, setText] = useState('')
  const [myAnswer, setMyAnswer] = useState(visitorAnswer)
  const [creatorVotes, setCreatorVotes] = useState(creatorAnswer?.vote_count ?? 0)
  const [visitorVotes, setVisitorVotes] = useState(visitorAnswer?.vote_count ?? 0)
  const [votedCreator, setVotedCreator] = useState(false)
  const [votedVisitor, setVotedVisitor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const creatorName = creator?.display_name || creator?.username || '?'
  const isOwnDuel = currentUserId === duel.creator_id

  const totalVotes = creatorVotes + visitorVotes
  const creatorPct = totalVotes > 0 ? Math.round((creatorVotes / totalVotes) * 100) : 50
  const visitorPct = 100 - creatorPct

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit() {
    if (text.trim().length < 10 || loading) return
    setLoading(true)
    try {
      const endpoint = currentUserId ? '/api/answer' : '/api/answer/anonymous'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: duel.scenario_id, content: text.trim(), mode: 'scenario' }),
      })
      const data = await res.json() as { answer?: { id: string; content: string; vote_count: number }; error?: string }
      if (!res.ok) { showToast(data.error ?? 'Bir hata oluştu.'); return }
      if (data.answer) {
        setMyAnswer(data.answer)
        setVisitorVotes(data.answer.vote_count)
        showToast('✓ Cevabın gönderildi!')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(forCreator: boolean) {
    if (!currentUserId) return
    if (forCreator && votedCreator) return
    if (!forCreator && votedVisitor) return

    const answerId = forCreator ? creatorAnswer?.id : myAnswer?.id
    if (!answerId) return

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId }),
      })
      if (forCreator) { setCreatorVotes(v => v + 1); setVotedCreator(true) }
      else { setVisitorVotes(v => v + 1); setVotedVisitor(true) }
    } catch {}
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-50 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg pointer-events-none bg-[#e7f6ec] text-[#14532d] border border-[#16a34a]/20">
          {toast}
        </div>
      )}

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
            {!isOwnDuel && (
              <p className="text-sm text-fg-muted mt-0.5">Aynı senaryoyu sen de cevapla, kim daha çok oy alır?</p>
            )}
          </div>
        </div>
      </div>

      {/* Scenario card */}
      {scenario && (
        <div
          className="rounded-2xl p-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
        >
          <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-widest mb-2">Senaryo</p>
          <p className="text-[15px] text-fg leading-relaxed font-medium">{scenario.content}</p>
        </div>
      )}

      {/* Vote result bar */}
      {(creatorAnswer && myAnswer) && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-fg-muted">
            <span style={{ color: 'var(--primary)' }}>{creatorName} %{creatorPct}</span>
            <span>%{visitorPct} Sen</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'var(--stroke)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${creatorPct}%`, background: 'var(--primary)' }}
            />
          </div>
          <p className="text-xs text-fg-subtle text-center">
            Topluluk %{creatorPct} ile <strong>{creatorName}</strong>&apos;i tercih etti
          </p>
        </div>
      )}

      {/* Two-column answers */}
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
              disabled={!currentUserId || votedCreator || isOwnDuel}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: votedCreator ? 'var(--primary)' : 'var(--surface-2)',
                color: votedCreator ? '#fff' : 'var(--fg-subtle)',
                border: votedCreator ? '1px solid var(--primary)' : '1px solid transparent',
              }}
            >
              <ChevronUp size={14} />
              {creatorVotes} oy
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
                style={{ background: '#64748b' }}
              >
                SN
              </div>
              <span className="text-[13px] font-semibold text-fg">
                Sen
                <span
                  className="ml-1.5 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: '#64748b', background: 'var(--surface-2)' }}
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
              {visitorVotes} oy
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
                  placeholder="Cevabını yaz..."
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

      {/* CTA */}
      <div
        className="rounded-2xl border p-5 flex flex-col items-center gap-3 text-center"
        style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
      >
        <p className="text-sm font-bold text-fg">Sen de Kapisio&apos;ya katıl</p>
        <p className="text-xs text-fg-muted">Her gün yeni senaryo, her gün yeni düello.</p>
        <Link href="/" className="w-full">
          <Button className="w-full btn-gradient">Bugünkü senaryoya cevap ver →</Button>
        </Link>
      </div>

    </div>
  )
}
