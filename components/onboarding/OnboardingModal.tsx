'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, X } from 'lucide-react'

const STEPS = [
  {
    emoji: '⚔️',
    title: "Kapisio'ya Hoş Geldin!",
    desc: 'Her gün yeni bir senaryo gelir. Cevapla, düello yap, kazan!',
    color: 'from-primary to-primary',
  },
  {
    emoji: '📝',
    title: 'Cevapla',
    desc: 'Günlük senaryoyu oku ve bakış açını paylaş. Ne kadar özgün olursan o kadar çok oy alırsın.',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    emoji: '⚡',
    title: 'Düello Yap',
    desc: 'Aynı senaryoyu yanıtlayan birini seç, düelloya çağır. Topluluk oylasın, AI karar versin!',
    color: 'from-primary to-secondary',
  },
  {
    emoji: '🏆',
    title: 'Puan Kazan',
    desc: 'Düello kazan, oy al, günlük giriş yap — puan topla, liderlik tablosuna çık!',
    color: 'from-amber-500 to-orange-500',
  },
]

interface Props {
  isNew?: boolean
}

export default function OnboardingModal({ isNew = false }: Props) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Only show for new users (account < 7 days old) AND haven't seen it
    if (!isNew) return
    const seen = localStorage.getItem('kapisio_onboarded_v2')
    if (seen) return
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [isNew])

  function dismiss() {
    localStorage.setItem('kapisio_onboarded_v2', '1')
    setVisible(false)
  }

  function finish() {
    localStorage.setItem('kapisio_onboarded_v2', '1')
    setVisible(false)
    router.push('/oyun')
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border border-stroke rounded-3xl overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-br ${current.color} p-8 text-center relative`}>
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="text-6xl mb-2">{current.emoji}</div>
          <div className="flex justify-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-black text-fg mb-2">{current.title}</h2>
          <p className="text-fg-muted text-sm leading-relaxed mb-6">{current.desc}</p>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 rounded-xl border border-stroke text-fg-subtle hover:text-fg text-sm font-medium transition-colors"
              >
                Geri
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${current.color} text-white text-sm font-bold transition-opacity hover:opacity-90`}
            >
              {isLast ? (
                <span>Hadi Oynayalım 🚀</span>
              ) : (
                <><span>Devam</span><ChevronRight size={14} /></>
              )}
            </button>
          </div>

          {step === 0 && (
            <button
              onClick={dismiss}
              className="w-full mt-3 text-xs text-fg-subtle hover:text-fg-muted transition-colors"
            >
              Tanıtımı atla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
