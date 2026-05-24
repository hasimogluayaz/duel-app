'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  Sparkles, Flame, Swords, Users, ArrowRight, X,
} from 'lucide-react'

interface Props {
  userId: string
  username: string
}

const SEEN_KEY = 'kapisio_welcome_seen'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Hoş geldin! 🎉',
    body: 'Her gün yeni bir ahlaki ikilem. Sen ne yapardın? Anlat — herkes okusun, oy versin.',
    color: 'from-primary to-blue-600',
  },
  {
    icon: Flame,
    title: 'Streak\'ini büyüt 🔥',
    body: 'Her gün cevap ver, art arda kaç gün geldiğin sayılsın. Streak ne kadar uzun, seviye o kadar yüksek.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Swords,
    title: 'Arkadaşını çağır ⚔️',
    body: 'Aynı senaryoya kim daha iyi cevap verir? Düello linki gönder, 4 kişiye kadar yarışın — AI veya topluluk karar versin.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Topluluk seni bekliyor 👥',
    body: 'Diğer cevapları oku, beğen, takip et. Mesajlaş, yorum yap. Burası senin alanın.',
    color: 'from-green-500 to-emerald-500',
  },
]

export function WelcomeModal({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const key = `${SEEN_KEY}_${userId}`
    if (!localStorage.getItem(key)) {
      // Slight delay so it doesn't pop on top of an unfinished render
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [userId])

  function finish() {
    localStorage.setItem(`${SEEN_KEY}_${userId}`, '1')
    setOpen(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  if (!open) return null
  const s = STEPS[step]
  const Icon = s.icon
  const isLast = step === STEPS.length - 1

  return (
    <Modal open={open} onClose={finish}>
      <div className="relative">
        <button
          onClick={finish}
          className="absolute -top-2 -right-2 p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2"
          aria-label="Kapat"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center py-2">
          {/* Hero icon with gradient bg */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon size={28} className="text-white" />
          </div>

          <h2 className="text-xl font-black text-fg mb-2 tracking-tight">{s.title}</h2>
          <p className="text-sm text-fg-muted leading-relaxed max-w-xs mb-6">{s.body}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-fg-subtle/30'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full">
            {step > 0 && (
              <Button onClick={back} variant="ghost" className="flex-1 text-fg-muted">
                Geri
              </Button>
            )}
            {isLast ? (
              <Link href="/" className="flex-1" onClick={finish}>
                <Button className="w-full btn-gradient gap-1.5">
                  Başlayalım <ArrowRight size={14} />
                </Button>
              </Link>
            ) : (
              <Button onClick={next} className="flex-1 btn-gradient gap-1.5">
                Devam <ArrowRight size={14} />
              </Button>
            )}
          </div>

          {step === 0 && (
            <button
              onClick={finish}
              className="text-[10px] text-fg-subtle hover:text-fg-muted mt-3"
            >
              Atla
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
