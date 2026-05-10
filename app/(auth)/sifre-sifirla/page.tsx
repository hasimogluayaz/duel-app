'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle } from 'lucide-react'

export default function SifreSifirlaPage() {
  const supabase = createClient()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      toast('Email gönderilemedi. Tekrar dene.', 'error')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-fg mb-3">Email gönderildi!</h2>
          <p className="text-fg-muted text-sm mb-6">
            <strong className="text-fg">{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
          </p>
          <Link href="/giris">
            <Button variant="outline">Giriş sayfasına dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-fg">⚡ Kapisio</Link>
          <h1 className="text-2xl font-bold text-fg mt-6 mb-2">Şifremi Unuttum</h1>
          <p className="text-fg-subtle text-sm">Email adresine sıfırlama bağlantısı göndereceğiz</p>
        </div>

        <div className="bg-surface border border-stroke rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email Adresi"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Sıfırlama Bağlantısı Gönder
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-fg-subtle mt-6">
          <Link href="/giris" className="text-primary/70 hover:text-primary/40">← Giriş sayfasına dön</Link>
        </p>
      </div>
    </div>
  )
}
