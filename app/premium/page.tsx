'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { isPremiumActive } from '@/lib/premium/check'
import { Check, Crown, Zap, Swords, Flame, Star, Shield, Settings } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  { icon: Swords,  text: 'Sınırsız günlük düello (ücretsiz: 3-10/gün)' },
  { icon: Flame,   text: '3 aylık streak freeze hakkı (ücretsiz: 0)' },
  { icon: Zap,     text: 'Sınırsız kişilik analizi (ücretsiz: aylık 1)' },
  { icon: Star,    text: 'Profilinde altın ⚡ Premium rozeti' },
  { icon: Crown,   text: 'Günlük 30 senaryo oluşturma hakkı' },
  { icon: Shield,  text: 'Sınırsız cevap (ücretsiz: 10-30/gün)' },
]

export default function PremiumPage() {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [premium, setPremium] = useState<{ active: boolean; until: string | null } | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then((authRes: any) => {
      const u = authRes.data.user
      setUser(u ?? null)
      if (u) {
        supabase.from('profiles')
          .select('is_premium, premium_until')
          .eq('id', u.id)
          .single()
          .then((r: any) => {
            const p = r.data
            setPremium({
              active: isPremiumActive(p),
              until: p?.premium_until ?? null,
            })
            setReady(true)
          })
      } else {
        setReady(true)
      }
    })
  }, [])

  async function startCheckout() {
    if (!user) { window.location.href = '/giris?redirect=/premium'; return }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      toast(data.error ?? 'Ödeme sayfası açılamadı.', 'error')
    } catch {
      toast('Bağlantı hatası.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      toast(data.error ?? 'Portal açılamadı.', 'error')
    } catch {
      toast('Bağlantı hatası.', 'error')
    } finally {
      setPortalLoading(false)
    }
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

      {/* Already premium */}
      {ready && premium?.active && (
        <Card className="mb-6 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 mb-3">
            <Crown size={24} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-black text-amber-500 mb-1">Premium üyesin ⚡</h2>
          {premium.until && (
            <p className="text-xs text-fg-subtle mb-4">
              Sonraki yenileme: {new Date(premium.until).toLocaleDateString('tr-TR')}
            </p>
          )}
          <Button onClick={openPortal} loading={portalLoading} className="gap-2" size="lg">
            <Settings size={15} />
            Aboneliği Yönet
          </Button>
        </Card>
      )}

      {/* Not premium yet — paid flow disabled, showing roadmap */}
      {ready && !premium?.active && (
        <Card className="mb-6 relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10" />

          <div className="flex flex-col gap-3 mb-6 relative">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-amber-400" />
                </div>
                <span className="text-sm text-fg-muted flex items-center gap-1.5">
                  <Icon size={12} className="text-amber-500/70" />
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-xl bg-surface border border-stroke text-center">
            <span className="text-2xl">🚧</span>
            <p className="text-sm font-bold text-fg">Çok Yakında</p>
            <p className="text-xs text-fg-subtle leading-relaxed">
              Premium üyelik henüz açılmadı. Kapisio şu an tamamen ücretsiz — gelişmeler için takipte kal!
            </p>
          </div>
        </Card>
      )}

      {/* FAQ */}
      <div className="flex flex-col gap-3">
        {[
          { q: 'Ne zaman iptal edebilirim?', a: 'İstediğin zaman, hemen etkili. Aylık ücret iadesi yok.' },
          { q: 'Ödeme güvenli mi?', a: 'Stripe ile işleniyor — kart bilgilerine biz hiç dokunmuyoruz.' },
          { q: 'Ücretsiz özellikleri kaybeder miyim?', a: 'Hayır, tüm ücretsiz özellikler kalır. Premium onlara ek gelir.' },
          { q: 'Premium iptal edersem ne olur?', a: 'Mevcut faturalandırma döneminin sonuna kadar premium özellikleri kullanmaya devam edersin.' },
        ].map(({ q, a }) => (
          <div key={q} className="border border-stroke rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-fg mb-1">{q}</p>
            <p className="text-xs text-fg-subtle">{a}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-fg-subtle mt-6">
        Sorun mu var?{' '}
        <Link href="/iletisim" className="text-primary hover:underline">İletişime geç</Link>
      </p>
    </div>
  )
}
