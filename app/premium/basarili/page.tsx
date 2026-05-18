'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function PremiumBasariliPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const t = setTimeout(() => router.push('/'), 5000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-xl animate-bounce">
          <Crown size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-fg mb-2">Hoş geldin, Premium!</h1>
        <p className="text-fg-subtle mb-6">
          Artık tüm premium özelliklere erişimin var. İyi kapışmalar! ⚔️
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full btn-gradient">
              <Sparkles size={16} />
              Hemen Oyna
            </Button>
          </Link>
          <Link href="/profil/ayarlar">
            <Button variant="secondary" className="w-full">Profilime Git</Button>
          </Link>
        </div>
        <p className="text-xs text-fg-subtle mt-4">5 saniye içinde otomatik yönlendirileceksiniz</p>
      </div>
    </div>
  )
}
