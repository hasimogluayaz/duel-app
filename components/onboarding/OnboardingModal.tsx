'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Star, ChevronRight, CheckCircle, Gift } from 'lucide-react'

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
    emoji: '⚖️',
    title: 'Karar Ver',
    description: 'Başkalarının cevaplarını karşılaştır, daha iyisini seç. Her oyun topluluk sıralamasını şekillendirir. Tinder gibi ama fikirlerle!',
    tip: 'Karar Ver moduna git →',
    color: 'from-cyan-600/20 to-blue-600/10',
    border: 'border-cyan-500/30',
  },
  {
    emoji: '🔥',
    title: 'Seriyi Kır',
    description: 'Her gün oynayarak seri yap. 7 günlük seri +100, 30 günlük seri +500 puan getirir. Streakini kaybetmemek için dondurma hakkın var!',
    tip: 'Streak = daha çok puan',
    color: 'from-amber-600/20 to-orange-600/10',
    border: 'border-amber-500/30',
  },
  {
    emoji: '🏆',
    title: 'Liderliğe Çık',
    description: 'Haftalık ve tüm zamanların liderlik tablosunda yerini al. Başarımlar kazan, tier yükselt ve unvan kazan!',
    tip: 'Haftalık · Aylık · Arkadaşlar sıralaması',
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
  const [referralCode, setReferralCode] = useState('')
  const [referralStatus, setReferralStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [referralMsg, setReferralMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isNewUser) {
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [isNewUser])

  async function applyReferral() {
    if (!referralCode.trim()) { finish(); return }
    setReferralStatus('loading')
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: referralCode.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setReferralStatus('success')
      setReferralMsg(`+${data.reward} puan kazandın! 🎉`)
      setTimeout(() => finish(), 1500)
    } else {
      setReferralStatus('error')
      setReferralMsg(data.error ?? 'Geçersiz kod.')
    }
  }

  async function finish() {
    setClosing(true)
    await supabase.from('profiles')
      .update({ onboarding_completed: true, onboarding_done: true } as any)
      .eq('id', userId)
    setTimeout(() => { setOpen(false); setClosing(false) }, 300)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!open) return null

  const isLastStep = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative w-full max-w-sm bg-bg border border-stroke rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-stroke">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((step + 1) / (STEPS.length + 1)) * 100}%` }}
          />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4 pb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-purple-500' : i < step ? 'w-1.5 bg-purple-500/40' : 'w-1.5 bg-stroke'
              }`}
            />
          ))}
          {/* referral dot */}
          <div className={`h-1.5 rounded-full transition-all duration-300 ${
            step > STEPS.length - 1 ? 'w-6 bg-green-500' : 'w-1.5 bg-stroke'
          }`} />
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

        {/* Referral prompt on last step */}
        {isLastStep && (
          <div className="mx-4 mt-3 bg-green-500/8 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={14} className="text-green-400" />
              <p className="text-xs font-semibold text-green-400">Davet Kodu Var Mı?</p>
            </div>
            <div className="flex gap-2">
              <input
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={12}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 font-mono uppercase focus:outline-none focus:border-green-500/40"
              />
              <button
                onClick={applyReferral}
                disabled={referralStatus === 'loading' || referralStatus === 'success'}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                {referralStatus === 'loading' ? '...' : referralStatus === 'success' ? '✓' : 'Uygula'}
              </button>
            </div>
            {referralMsg && (
              <p className={`text-xs mt-1.5 ${referralStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {referralMsg}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex flex-col gap-2">
          <Button onClick={isLastStep ? (referralCode ? applyReferral : finish) : next} className="w-full btn-gradient">
            {!isLastStep ? (
              <>Devam <ChevronRight size={15} /></>
            ) : (
              <><CheckCircle size={15} /> Başlayalım! 🚀</>
            )}
          </Button>
          {step < STEPS.length - 1 && (
            <button onClick={finish} className="text-xs text-fg-subtle hover:text-fg transition-colors text-center py-1">
              Atla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
