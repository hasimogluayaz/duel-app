'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Check, Crown, Zap, Swords, Flame, Star, Shield } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  { icon: Swords,  text: 'Sınırsız günlük düello daveti (ücretsiz: 5/gün)' },
  { icon: Flame,   text: '3 aylık streak freeze hakkı (ücretsiz: 0)' },
  { icon: Star,    text: 'Özel altın rozet ve profil çerçevesi' },
  { icon: Crown,   text: 'Premium ⚡ rozeti profilinde' },
  { icon: Shield,  text: 'Reklamlara ve spamcılara öncelikli mod koruması' },
  { icon: Zap,     text: 'Haftalık AI kişilik raporu (ücretsiz: aylık)' },
]

export default function PremiumPage() {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then((authRes: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const u = authRes.data.user
      setUser(u)
      if (u) {
        supabase.from('profiles').select('is_premium').eq('id', u.id).single()
          .then((r: { data: { is_premium?: boolean } | null }) => {
            if (r.data) setIsPremium(!!(r.data as any).is_premium)
          })
      }
    })
  }, [])

  async function startCheckout() {
    if (!user) { window.location.href = '/giris'; return }
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { toast('Ödeme sayfası açılamadı.', 'error'); setLoading(false) }
  }

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { toast('Portal açılamadı.', 'error'); setPortalLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
          <Crown size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-fg mb-2">Kapisio Premium</h1>
        <p className="text-fg-subtle text-base">Daha fazla düello. Daha fazla güç. Daha fazla eğlence.</p>
      </div>

      {/* Price card */}
      <Card className="mb-6 relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10" />
        <div className="text-center mb-6">
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="text-4xl font-black text-fg">₺29</span>
            <span className="text-fg-subtle mb-1.5">/ay</span>
          </div>
          <p className="text-xs text-fg-subtle">İstediğin zaman iptal et</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Check size={11} className="text-amber-400" />
              </div>
              <span className="text-sm text-fg-muted">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 py-4 rounded-xl bg-surface border border-stroke text-center">
          <span className="text-2xl">🚧</span>
          <p className="text-sm font-bold text-fg">Çok Yakında</p>
          <p className="text-xs text-fg-subtle">Premium özellikler hazırlanıyor. Yakında burada olacak!</p>
        </div>
      </Card>

      {/* FAQ */}
      <div className="flex flex-col gap-3">
        {[
          { q: 'Ne zaman iptal edebilirim?', a: 'İstediğin zaman, hemen etkili.' },
          { q: 'Ödeme güvenli mi?', a: 'Stripe ile işleniyor — kart bilgilerine hiç dokunmuyoruz.' },
          { q: 'Ücretsiz özellikleri kaybeder miyim?', a: 'Hayır, tüm ücretsiz özellikler kalır. Premium onlara ek gelir.' },
        ].map(({ q, a }) => (
          <div key={q} className="border border-stroke rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-fg mb-1">{q}</p>
            <p className="text-xs text-fg-subtle">{a}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-fg-subtle mt-6">
        Sorun mu var?{' '}
        <Link href="/iletisim" className="text-primary/70 hover:text-primary/40">İletişime geç</Link>
      </p>
    </div>
  )
}
