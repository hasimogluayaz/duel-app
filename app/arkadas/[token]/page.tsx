'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { Users, Zap, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Challenge {
  id: string
  token: string
  expires_at: string
  challenger: { username: string; display_name: string; avatar_url: string | null; total_points?: number }
  scenario: { id: string; content: string; category: string }
  challenger_answer: { id: string; content: string; vote_count: number }
}

type Phase = 'loading' | 'intro' | 'answer' | 'result' | 'error'

export default function ArkadasChallengePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [phase, setPhase]           = useState<Phase>('loading')
  const [challenge, setChallenge]   = useState<Challenge | null>(null)
  const [friendAnswer, setFriendAnswer] = useState<{ content: string } | null>(null)
  const [compatibility, setCompatibility] = useState<number | null>(null)
  const [content, setContent]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')

  useEffect(() => {
    fetch(`/api/arkadas-challenge?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); setPhase('error'); return }
        setChallenge(data.challenge)
        if (data.friendAnswer) {
          setFriendAnswer(data.friendAnswer)
          setCompatibility(data.compatibilityScore)
          setPhase('result')
        } else {
          setPhase('intro')
        }
      })
      .catch(() => { setErrorMsg('Yüklenirken bir hata oluştu.'); setPhase('error') })
  }, [token])

  async function submitAnswer() {
    if (!content.trim() || content.trim().length < 10) return
    setSubmitting(true)
    const res = await fetch('/api/arkadas-challenge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, content: content.trim() }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setErrorMsg(data.error ?? 'Bir hata oluştu.'); return }
    setFriendAnswer(data.friend_answer)
    setCompatibility(data.compatibility)
    setPhase('result')
  }

  if (phase === 'loading') return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
      <Loader2 size={32} className="text-violet-400 animate-spin" />
    </div>
  )

  if (phase === 'error') return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-white font-bold text-xl mb-2">Meydan Okuma Bulunamadı</h1>
        <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )

  if (!challenge) return null
  const tier = getTier(challenge.challenger?.total_points ?? 0)
  const expiresIn = Math.max(0, Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black text-white">DUEL</span>
          </Link>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Users size={12} className="text-violet-400" />
            <span className="text-xs text-violet-400 font-semibold">Arkadaş Meydan Okuması</span>
          </div>
        </div>

        {/* Challenger card */}
        <div className="rounded-2xl bg-[#1a1a2e] border border-violet-500/20 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={challenge.challenger.avatar_url} username={challenge.challenger.username} size="md" />
            <div>
              <p className="text-white font-semibold">{challenge.challenger.display_name || challenge.challenger.username}</p>
              <p className="text-xs text-white/40">{tier.emoji} {tier.label} • sana meydan okuyor</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <p className="text-xs text-white/40 mb-1">Senaryo</p>
            <p className="text-sm text-white/80 italic leading-relaxed">&ldquo;{challenge.scenario.content}&rdquo;</p>
          </div>

          <div className="bg-violet-500/8 rounded-xl p-3 border border-violet-500/15">
            <p className="text-xs text-violet-400 mb-1">
              {challenge.challenger.display_name || challenge.challenger.username} şöyle dedi:
            </p>
            <p className="text-sm text-white leading-relaxed">{challenge.challenger_answer.content}</p>
          </div>

          {expiresIn > 0 && phase !== 'result' && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-white/30">
              <Clock size={10} />
              <span>{expiresIn} gün içinde sona eriyor</span>
            </div>
          )}
        </div>

        {/* Phase: intro */}
        {phase === 'intro' && (
          <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 p-5">
            <h2 className="text-white font-bold mb-1">Senin Cevabın Neydi?</h2>
            <p className="text-white/50 text-sm mb-4">
              Aynı senaryoya sen ne cevap verirdin? Yaz, karşılaştıralım.
            </p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Cevabını buraya yaz..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            {content.trim().length > 0 && content.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">En az 10 karakter gerekli.</p>
            )}
            {errorMsg && (
              <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
            )}
            <button
              onClick={submitting ? undefined : submitAnswer}
              disabled={submitting || content.trim().length < 10}
              className="w-full mt-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : <><Zap size={14} /> Cevapla & Karşılaştır</>}
            </button>
            <p className="text-xs text-white/30 text-center mt-3">Hesap gerekmez — ama üye olursan kendi profilinde görünür.</p>
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && friendAnswer && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#1a1a2e] border border-green-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm font-semibold text-green-400">Cevabın kaydedildi!</span>
              </div>

              {/* Compatibility score */}
              {compatibility !== null && (
                <div className="text-center mb-5">
                  <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff08" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={compatibility >= 70 ? '#22c55e' : compatibility >= 50 ? '#a855f7' : '#f59e0b'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - compatibility / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">%{compatibility}</span>
                      <span className="text-[10px] text-white/40">uyum</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    {compatibility >= 80 ? '🔥 İnanılmaz uyum! Aynı dalga boyundasınız.' :
                     compatibility >= 60 ? '✨ Benzer düşünüyorsunuz.' :
                     compatibility >= 40 ? '🤔 İlginç farklılıklar var.' :
                     '⚡ Tamamen farklı bakış açıları!'}
                  </p>
                </div>
              )}

              {/* Side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-violet-500/8 rounded-xl p-3 border border-violet-500/15">
                  <p className="text-[10px] text-violet-400 font-semibold mb-1 uppercase tracking-wider">
                    {challenge.challenger.display_name || challenge.challenger.username}
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">{challenge.challenger_answer.content}</p>
                </div>
                <div className="bg-green-500/8 rounded-xl p-3 border border-green-500/15">
                  <p className="text-[10px] text-green-400 font-semibold mb-1 uppercase tracking-wider">Sen</p>
                  <p className="text-xs text-white/70 leading-relaxed">{friendAnswer.content}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-[#1a1a2e] border border-white/5 p-5 text-center">
              <p className="text-sm text-white/60 mb-4">Sen de arkadaşlarına meydan oku!</p>
              <Link
                href="/kayit"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
              >
                <Zap size={14} />
                Ücretsiz Katıl
              </Link>
              <p className="text-xs text-white/30 mt-3">Kendi meydan okumalarını oluştur, liderlik tablosuna gir.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
