'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { Sparkles, Star, Lock, CheckCircle, ChevronDown } from 'lucide-react'
import type { Profile, Scenario, Answer } from '@/types'
import { ModeSwitcher } from '@/components/modes/ModeSwitcher'

const PRESET_CHARACTERS = [
  { name: 'Sherlock Holmes', emoji: '🔍' },
  { name: 'Joker', emoji: '🃏' },
  { name: 'Darth Vader', emoji: '🌑' },
  { name: 'Tony Stark', emoji: '🦾' },
  { name: 'Hermione Granger', emoji: '📚' },
  { name: 'Jack Sparrow', emoji: '⚓' },
  { name: 'The Mandalorian', emoji: '🪖' },
  { name: 'Walter White', emoji: '🧪' },
  { name: 'Gollum', emoji: '💍' },
  { name: 'James Bond', emoji: '🎰' },
]

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  userId: string | null
  communityAnswers: any[]
}

export function KarakterClient({ scenario, profile, userAnswer: initialAnswer, userId, communityAnswers }: Props) {
  const router = useRouter()
  const toast = useToast()
  const isGuest = !userId

  const [character, setCharacter] = useState('')
  const [customCharacter, setCustomCharacter] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userAnswer, setUserAnswer] = useState(initialAnswer)
  const [showPresets, setShowPresets] = useState(false)
  const [joinModal, setJoinModal] = useState(false)

  const effectiveCharacter = character === '__custom__' ? customCharacter.trim() : character
  const charCount = answer.length
  const isValid = effectiveCharacter.length >= 2 && answer.trim().length >= 10

  async function submit() {
    if (!scenario) return
    if (isGuest) { setJoinModal(true); return }
    if (!isValid) {
      if (!effectiveCharacter) { toast('Bir karakter seç veya yaz.', 'error'); return }
      toast('Cevap en az 10 karakter olmalı.', 'error')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenario.id,
        content: answer.trim(),
        mode: 'character',
        mode_metadata: { character: effectiveCharacter },
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Cevap kaydedilemedi.', 'error'); setSubmitting(false); return }
    setUserAnswer(json.answer)
    toast(`${effectiveCharacter} olarak cevabın kaydedildi! +5 puan`, 'success')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Mode switcher */}
      <ModeSwitcher />

      {/* Header */}
      <div>
        <h1 className="text-base font-black text-fg">Karakter Kapışması</h1>
        <p className="text-xs text-fg-subtle mt-0.5">Bir karaktere bürün ve o karakterin ağzıyla cevap ver</p>
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center gap-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl px-4 py-3">
          <p className="text-sm text-fg-muted flex-1">Karakter olarak cevap vermek için <span className="font-semibold text-violet-500">ücretsiz katıl</span></p>
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
              <span className="text-xs font-bold text-violet-500 uppercase tracking-wider flex items-center gap-1.5">
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
            <div className="bg-surface border border-green-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">Cevabın kaydedildi</span>
                {(userAnswer as any).mode_metadata?.character && (
                  <span className="ml-auto text-xs text-fg-subtle font-semibold">
                    {(userAnswer as any).mode_metadata.character} olarak
                  </span>
                )}
              </div>
              <p className="text-sm text-fg-muted italic border-l-2 border-purple-500/40 pl-3 leading-relaxed">
                &ldquo;{userAnswer.content}&rdquo;
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-stroke rounded-2xl p-4 space-y-4">
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Hangi karakteri oynuyorsun?</p>

              {/* Character selection */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="w-full flex items-center justify-between bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm hover:border-purple-500/30 transition-colors"
                >
                  <span className={effectiveCharacter ? 'text-fg font-semibold' : 'text-fg-subtle'}>
                    {effectiveCharacter || 'Karakter seç veya yaz...'}
                  </span>
                  <ChevronDown size={14} className={`text-fg-subtle transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                </button>

                {showPresets && (
                  <div className="grid grid-cols-2 gap-1.5 bg-bg border border-stroke rounded-xl p-2">
                    {PRESET_CHARACTERS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => { setCharacter(c.name); setShowPresets(false) }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          character === c.name ? 'bg-surface-2 text-fg font-semibold' : 'text-fg-muted hover:bg-surface-2'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setCharacter('__custom__'); setShowPresets(false) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        character === '__custom__' ? 'bg-surface-2 text-fg font-semibold' : 'text-fg-muted hover:bg-surface-2'
                      }`}
                    >
                      <span>✏️</span>
                      <span>Kendi karakterim</span>
                    </button>
                  </div>
                )}

                {character === '__custom__' && (
                  <input
                    type="text"
                    value={customCharacter}
                    onChange={e => setCustomCharacter(e.target.value)}
                    placeholder="Karakter adı yaz..."
                    maxLength={50}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-fg outline-none focus:border-purple-500/50 placeholder:text-fg-subtle"
                  />
                )}
              </div>

              {/* Character answer textarea */}
              {(character || customCharacter) && (
                <div className="space-y-2">
                  <p className="text-xs text-fg-subtle">
                    <span className="font-semibold text-fg">{effectiveCharacter || '...'}</span> bu durumda ne derdi?
                  </p>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={`${effectiveCharacter || 'Karakter'} olarak cevap ver...`}
                    maxLength={280}
                    rows={4}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-fg outline-none focus:border-purple-500/50 placeholder:text-fg-subtle resize-none leading-relaxed"
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
                {submitting ? 'Kaydediliyor...' : 'Karakteri Oyna'}
              </Button>
            </div>
          )}

          {/* Community answers */}
          {communityAnswers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Topluluktan Karakterler</p>
              <div className="flex flex-col gap-2">
                {communityAnswers.map((a: any, i: number) => {
                  const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                  const charName = a.mode_metadata?.character
                  const blurred = !userAnswer && i >= 3

                  return (
                    <div key={a.id} className="relative rounded-xl border border-stroke bg-surface p-4">
                      <div className={`flex items-start gap-3 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                        <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-fg">{p?.display_name || p?.username}</span>
                            {charName && (
                              <span className="text-xs bg-surface-2 border border-stroke px-2 py-0.5 rounded-md text-fg-subtle font-semibold">
                                {charName} olarak
                              </span>
                            )}
                            {a.vote_count > 0 && (
                              <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                <Star size={10} className="fill-amber-400" />
                                {a.vote_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-fg-muted leading-relaxed italic line-clamp-3">&ldquo;{a.content}&rdquo;</p>
                        </div>
                      </div>

                      {blurred && (
                        <Link href="/kayit" className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[3px] hover:bg-surface/60 transition-colors">
                          <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-2 shadow-md">
                            <Lock size={13} className="text-purple-400" />
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
            <p className="text-2xl mb-3">🎭</p>
            <h3 className="text-base font-bold text-fg mb-1">Hesap gerekli</h3>
            <p className="text-sm text-fg-muted mb-4">Karakter olarak cevap vermek için ücretsiz hesap oluştur.</p>
            <Link href="/kayit" className="block">
              <Button className="btn-gradient w-full">Ücretsiz Katıl</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
