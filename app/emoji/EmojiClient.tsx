'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { Sparkles, Star, Lock, CheckCircle } from 'lucide-react'
import type { Profile, Scenario, Answer } from '@/types'
import { ModeSwitcher } from '@/components/modes/ModeSwitcher'

// Common emoji rows for the quick picker
const EMOJI_ROWS = [
  ['😂', '😭', '🥺', '😍', '🤣', '😊', '😎', '🥲', '😤', '🫠'],
  ['❤️', '🔥', '💀', '✨', '😮', '🤔', '👀', '💯', '🙏', '😴'],
  ['🤯', '😡', '🤮', '😱', '🥶', '🤑', '😏', '🫢', '🤭', '😮‍💨'],
  ['👏', '🫶', '💪', '🤦', '🙌', '👇', '☝️', '🤷', '🫡', '🤌'],
  ['🎉', '💸', '🏆', '⚡', '💥', '🌚', '🍿', '🎭', '🗿', '💔'],
]

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  userId: string | null
  communityAnswers: any[]
}

function isEmojiOnly(str: string): boolean {
  if (!str.trim()) return false
  return !/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9.,!?;:()\-_"'@#$%^&*+=<>/\\[\]{}|`~]/.test(str.trim())
}

export function EmojiClient({ scenario, profile, userAnswer: initialAnswer, userId, communityAnswers }: Props) {
  const router = useRouter()
  const toast = useToast()
  const isGuest = !userId

  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userAnswer, setUserAnswer] = useState(initialAnswer)
  const [joinModal, setJoinModal] = useState(false)

  const isValid = isEmojiOnly(answer) && answer.trim().length > 0

  function addEmoji(emoji: string) {
    if (userAnswer) return
    setAnswer(prev => prev + emoji)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    // Strip Latin letters, digits, common punctuation — keep emojis & whitespace
    const stripped = val.replace(/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9.,!?;:()\-_"'@#$%^&*+=<>/\\[\]{}|`~]/g, '')
    setAnswer(stripped)
  }

  async function submit() {
    if (!scenario) return
    if (isGuest) { setJoinModal(true); return }
    if (!isValid) { toast('Sadece emoji kullanabilirsin!', 'error'); return }

    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario.id, content: answer.trim(), mode: 'emoji' }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Cevap kaydedilemedi.', 'error'); setSubmitting(false); return }
    setUserAnswer(json.answer)
    toast('Emoji cevabın kaydedildi! +5 puan', 'success')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Mode switcher */}
      <ModeSwitcher />

      {/* Header */}
      <div>
        <h1 className="text-base font-black text-fg">Emoji Kapışması</h1>
        <p className="text-xs text-fg-subtle mt-0.5">Kelime yasak — sadece emoji ile ifade et</p>
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
          <p className="text-sm text-fg-muted flex-1">Emoji cevabı kaydetmek için <span className="font-semibold text-primary">ücretsiz katıl</span></p>
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
                Günün Senaryosu
              </span>
              <span className="text-xs text-fg-subtle">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <p className="text-lg font-bold text-fg leading-snug">{scenario.content}</p>
          </div>

          {/* Answer area */}
          {userAnswer ? (
            <div className="bg-surface border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">Cevabın kaydedildi</span>
              </div>
              <p className="text-3xl leading-relaxed">{userAnswer.content}</p>
            </div>
          ) : (
            <div className="bg-surface border border-stroke rounded-2xl p-4 space-y-4">
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Emoji ile cevapla</p>

              {/* Display area */}
              <div className="min-h-[56px] rounded-xl border border-stroke bg-bg px-4 py-3 text-3xl leading-relaxed tracking-wide">
                {answer || <span className="text-fg-subtle text-sm">Aşağıdan emoji seç veya yaz...</span>}
              </div>

              {/* Text input (emoji keyboard on mobile) */}
              <input
                type="text"
                value={answer}
                onChange={handleInput}
                placeholder="Emoji yaz..."
                className="w-full bg-transparent border border-stroke rounded-xl px-4 py-2.5 text-2xl outline-none focus:border-primary/50 placeholder:text-fg-subtle placeholder:text-sm"
                disabled={!!submitting}
                inputMode="text"
              />

              {answer && !isValid && (
                <p className="text-xs text-red-400">Sadece emoji kullanılabilir.</p>
              )}

              {/* Quick emoji picker */}
              <div className="space-y-2">
                <p className="text-xs text-fg-subtle">Hızlı seç:</p>
                {EMOJI_ROWS.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-1">
                    {row.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-2 transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Clear + Submit */}
              <div className="flex gap-2">
                {answer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnswer('')}
                    className="text-fg-subtle"
                  >
                    Temizle
                  </Button>
                )}
                <Button
                  className="btn-gradient flex-1"
                  disabled={!isValid || submitting}
                  onClick={submit}
                >
                  {submitting ? 'Kaydediliyor...' : 'Cevabı Gönder'}
                </Button>
              </div>
            </div>
          )}

          {/* Community answers */}
          {communityAnswers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Topluluktan Cevaplar</p>
              <div className="flex flex-col gap-2">
                {communityAnswers.map((a: any, i: number) => {
                  const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                  const blurred = !userAnswer && i >= 3

                  return (
                    <div key={a.id} className="relative rounded-xl border border-stroke bg-surface p-4">
                      <div className={`flex items-center gap-3 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-fg">{p?.display_name || p?.username}</span>
                            {a.vote_count > 0 && (
                              <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                <Star size={10} className="fill-amber-400" />
                                {a.vote_count}
                              </span>
                            )}
                          </div>
                          <p className="text-2xl leading-relaxed">{a.content}</p>
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
            <p className="text-2xl mb-3">🔐</p>
            <h3 className="text-base font-bold text-fg mb-1">Hesap gerekli</h3>
            <p className="text-sm text-fg-muted mb-4">Emoji cevabı kaydetmek için ücretsiz hesap oluştur.</p>
            <Link href="/kayit" className="block">
              <Button className="btn-gradient w-full">Ücretsiz Katıl</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
