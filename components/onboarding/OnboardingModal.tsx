'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Sparkles, Swords, Trophy, Star, ChevronRight, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    emoji: '✍️',
    title: 'Senaryoya Cevap Ver',
    description: 'Her gün yeni bir senaryo yayınlanır. Cevabını yaz ve +5 puan kazan. Özgün, eğlenceli ya da dürüst — seçim senin!',
    tip: '+5 puan · Her gün yeni senaryo',
    color: 'from-violet-600/20 to-purple-600/10',
    border: 'border-purple-500/30',
  },
  {
    emoji: '⚔️',
    title: 'Düelloya Gir',
    description: 'Cevabını yazdıktan sonra birini düelloya çağır ya da rastgele rakip bul. En çok oy toplayan kazanır — AI da karar verir!',
    tip: '+50 puan kazanırsın · AI hakem',
    color: 'from-pink-600/20 to-rose-600/10',
    border: 'border-pink-500/30',
  },
  {
    emoji: '🔥',
    title: 'Seriyi Kır',
    description: 'Her gün oynayarak seri yap. 7 günlük seri +100, 30 günlük seri +500 puan getirir. Streak\'i kaybetmemek için 3 dondurma hakkın var!',
    tip: 'Streak = daha çok puan',
    color: 'from-amber-600/20 to-orange-600/10',
    border: 'border-amber-500/30',
  },
  {
    emoji: '🏆',
    title: 'Liderliğe Çık',
    description: 'Haftalık ve tüm zamanların liderlik tablosunda yerini al. Başarımlar kazan, tier yükselt ve toplulukta öne çık!',
    tip: 'Haftalık · Aylık yarışmalar',
    color: 'from-green-600/20 to-emerald-600/10',
    border: 'border-green-500/30',
  },
]

interface Props {
  userId: string
  isNewUser: boolean
}

export function OnboardingModal({ userId, isNewUser }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isNewUser) {
      // Small delay so the page loads first
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [isNewUser])

  async function finish() {
    setClosing(true)
    // Mark onboarding done in DB
    await supabase.from('profiles').update({ onboarding_done: true } as any).eq('id', userId)
    setTimeout(() => { setOpen(false); setClosing(false) }, 300)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!open) return null

  const current = STEPS[step]

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative w-full max-w-sm bg-bg border border-stroke rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-purple-500' : i < step ? 'w-1.5 bg-purple-500/40' : 'w-1.5 bg-stroke'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className={`bg-gradient-to-br ${current.color} border-b ${current.border} mx-4 mt-3 rounded-2xl p-6 text-center`}>
          <div className="text-5xl mb-3">{current.emoji}</div>
          <h2 className="text-xl font-black text-fg mb-2">{current.title}</h2>
          <p className="text-sm text-fg-muted leading-relaxed">{current.description}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 font-semibold">
            <Star size={10} className="fill-purple-400" />
            {current.tip}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex flex-col gap-2">
          <Button onClick={next} className="w-full btn-gradient">
            {step < STEPS.length - 1 ? (
              <>
                Devam <ChevronRight size={15} />
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                Anladım, Başlayalım!
              </>
            )}
          </Button>
          {step < STEPS.length - 1 && (
            <button
              onClick={finish}
              className="text-xs text-fg-subtle hover:text-fg transition-colors text-center py-1"
            >
              Atla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
