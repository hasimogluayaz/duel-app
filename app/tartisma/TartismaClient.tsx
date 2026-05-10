'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { Sparkles, Star, Lock, CheckCircle, Flame, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ContentMenu } from '@/components/ui/ContentMenu'
import type { Profile, Scenario, Answer } from '@/types'
import { ModeSwitcher } from '@/components/modes/ModeSwitcher'

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  userId: string | null
  communityAnswers: any[]
  forCount: number
  againstCount: number
  debateQuestion: string | null
}

export function TartismaClient({ scenario, profile, userAnswer: initialAnswer, userId, communityAnswers, forCount, againstCount, debateQuestion }: Props) {
  const router = useRouter()
  const toast = useToast()
  const isGuest = !userId

  const [side, setSide] = useState<'for' | 'against' | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userAnswer, setUserAnswer] = useState(initialAnswer)
  const [joinModal, setJoinModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'for' | 'against'>('all')

  const charCount = answer.length
  const isValid = side !== null && answer.trim().length >= 10

  const total = forCount + againstCount
  const forPct = total > 0 ? Math.round((forCount / total) * 100) : 50
  const againstPct = total > 0 ? 100 - forPct : 50

  async function submit() {
    if (!scenario) return
    if (isGuest) { setJoinModal(true); return }
    if (!isValid) {
      if (!side) { toast('Bir taraf seç: Katılıyorum veya Katılmıyorum.', 'error'); return }
      toast('Argüman en az 10 karakter olmalı.', 'error')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenario.id,
        content: answer.trim(),
        mode: 'debate',
        mode_metadata: { side },
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Cevap kaydedilemedi.', 'error'); setSubmitting(false); return }
    setUserAnswer(json.answer)
    toast('Argümanın kaydedildi! +5 puan', 'success')
    setSubmitting(false)
    router.refresh()
  }

  const filteredAnswers = filter === 'all'
    ? communityAnswers
    : communityAnswers.filter((a: any) => a.mode_metadata?.side === filter)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Mode switcher */}
      <ModeSwitcher />

      {/* Header */}
      <div>
        <h1 className="text-base font-black text-fg">Ateşli Tartışma</h1>
        <p className="text-xs text-fg-subtle mt-0.5">Tarafını seç, görüşünü savun — topluluk hakem</p>
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
          <p className="text-sm text-fg-muted flex-1">Tartışmaya katılmak için <span className="font-semibold text-primary">ücretsiz katıl</span></p>
          <Link href="/kayit">
            <Button size="sm" className="btn-gradient shrink-0">Katıl</Button>
          </Link>
        </div>
      )}

      {/* Today's scenario */}
      {!scenario ? (
        <div className="text-center py-12 bg-surface border border-stroke rounded-2xl">
          <p className="text-3xl mb-3">🌙</p>
          <h2 className="text-base font-bold text-fg">Bugünkü senaryo hazırlanıyor</h2>
          <p className="text-xs text-fg-subtle mt-1">Birazdan yayınlanacak.</p>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-stroke rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} />
                Günün Tartışması
              </span>
              <span className="text-xs text-fg-subtle">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <p className="text-lg font-bold text-fg leading-snug">
              {debateQuestion ?? scenario.content}
            </p>
            {debateQuestion && (
              <p className="text-xs text-fg-subtle mt-1.5 italic">{scenario.content}</p>
            )}

            {/* Live side distribution */}
            {total > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-fg-subtle">
                  <span className="flex items-center gap-1 text-green-400 font-semibold">
                    <ThumbsUp size={10} />
                    Katılıyorum {forPct}%
                  </span>
                  <span className="flex items-center gap-1 text-red-400 font-semibold">
                    Katılmıyorum {againstPct}%
                    <ThumbsDown size={10} />
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bg overflow-hidden flex">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${forPct}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-500 flex-1"
                  />
                </div>
                <p className="text-xs text-fg-subtle text-center">{total} kişi taraf seçti</p>
              </div>
            )}
          </div>

          {/* Answer area */}
          {userAnswer ? (
            <div className={`bg-surface rounded-2xl p-4 space-y-3 border ${
              (userAnswer as any).mode_metadata?.side === 'for'
                ? 'border-green-500/20'
                : 'border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">Argümanın kaydedildi</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md border ${
                  (userAnswer as any).mode_metadata?.side === 'for'
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {(userAnswer as any).mode_metadata?.side === 'for' ? 'Katılıyorum' : 'Katılmıyorum'}
                </span>
              </div>
              <p className="text-sm text-fg-muted leading-relaxed">{userAnswer.content}</p>
            </div>
          ) : (
            <div className="bg-surface border border-stroke rounded-2xl p-4 space-y-4">
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Tarafını seç</p>

              {/* Side selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSide('for')}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                    side === 'for'
                      ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : 'border-stroke bg-bg text-fg-subtle hover:border-green-500/30 hover:bg-green-500/5'
                  }`}
                >
                  <ThumbsUp size={22} className={side === 'for' ? 'text-green-400' : ''} />
                  <span className="text-sm font-bold">Katılıyorum</span>
                  <span className="text-xs opacity-70">Bu doğru, savunurum</span>
                </button>
                <button
                  onClick={() => setSide('against')}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                    side === 'against'
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-stroke bg-bg text-fg-subtle hover:border-red-500/30 hover:bg-red-500/5'
                  }`}
                >
                  <ThumbsDown size={22} className={side === 'against' ? 'text-red-400' : ''} />
                  <span className="text-sm font-bold">Katılmıyorum</span>
                  <span className="text-xs opacity-70">Bu yanlış, karşı çıkarım</span>
                </button>
              </div>

              {/* Argument textarea */}
              {side && (
                <div className="space-y-2">
                  <p className="text-xs text-fg-subtle">
                    Neden <span className={`font-semibold ${side === 'for' ? 'text-green-400' : 'text-red-400'}`}>
                      {side === 'for' ? 'katılıyorsun' : 'katılmıyorsun'}
                    </span>? Argümanını yaz:
                  </p>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Güçlü bir argüman yaz..."
                    maxLength={280}
                    rows={4}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-fg outline-none focus:border-primary/50 placeholder:text-fg-subtle resize-none leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${charCount > 250 ? 'text-amber-400' : 'text-fg-subtle'}`}>
                      {charCount}/280
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="btn-gradient w-full"
                disabled={!isValid || submitting}
                onClick={submit}
              >
                {submitting ? 'Kaydediliyor...' : (
                  <span className="flex items-center gap-2">
                    <Flame size={14} />
                    Argümanı Gönder
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Community answers */}
          {communityAnswers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Argümanlar</p>
                <div className="flex gap-1">
                  {(['all', 'for', 'against'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                        filter === f
                          ? f === 'for' ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : f === 'against' ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-surface-2 text-fg border border-stroke'
                          : 'text-fg-subtle hover:text-fg'
                      }`}
                    >
                      {f === 'all' ? 'Tümü' : f === 'for' ? 'Katılıyorum' : 'Katılmıyorum'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {filteredAnswers.map((a: any, i: number) => {
                  const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                  const answerSide = a.mode_metadata?.side as 'for' | 'against' | undefined
                  const blurred = !userAnswer && i >= 3

                  return (
                    <div key={a.id} className={`relative rounded-xl border bg-surface p-4 ${
                      answerSide === 'for' ? 'border-green-500/15' : answerSide === 'against' ? 'border-red-500/15' : 'border-stroke'
                    }`}>
                      <div className={`flex items-start gap-3 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-fg">{p?.display_name || p?.username}</span>
                            {answerSide && (
                              <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${
                                answerSide === 'for'
                                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                  : 'border-red-500/30 bg-red-500/10 text-red-400'
                              }`}>
                                {answerSide === 'for' ? 'Katılıyorum' : 'Katılmıyorum'}
                              </span>
                            )}
                            {a.vote_count > 0 && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                <Star size={10} className="fill-amber-400" />
                                {a.vote_count}
                              </span>
                            )}
                            <span className="ml-auto">
                              <ContentMenu
                                targetType="answer"
                                targetId={a.id}
                                userId={userId}
                                isOwn={a.user_id === userId}
                                size={13}
                              />
                            </span>
                          </div>
                          <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">{a.content}</p>
                        </div>
                      </div>

                      {blurred && (
                        <Link href="/kayit" className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[3px] hover:bg-surface/60 transition-colors">
                          <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-2 shadow-md">
                            <Lock size={13} className="text-primary/70" />
                            <span className="text-xs font-semibold text-fg">Görmek için katıl</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Join modal */}
      {joinModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setJoinModal(false)}>
          <div className="bg-surface border border-stroke rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <p className="text-2xl mb-3">🔥</p>
            <h3 className="text-base font-bold text-fg mb-1">Hesap gerekli</h3>
            <p className="text-sm text-fg-muted mb-4">Tartışmaya katılmak için ücretsiz hesap oluştur.</p>
            <Link href="/kayit" className="block">
              <Button className="btn-gradient w-full">Ücretsiz Katıl</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
