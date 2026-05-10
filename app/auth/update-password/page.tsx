'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-fg-subtle">Yükleniyor...</div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  )
}

function UpdatePasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends a RECOVERY event after the magic link is followed
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    // Also check if there's already a valid session (user landed from email link)
    supabase.auth.getSession().then((res: { data: { session: unknown } }) => {
      if (res.data.session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast('Şifreler eşleşmiyor.', 'error')
      return
    }
    if (form.password.length < 8) {
      toast('Şifre en az 8 karakter olmalı.', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })

    if (error) {
      toast('Şifre güncellenemedi: ' + error.message, 'error')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/oyun'), 2500)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-2xl text-fg">
            <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-gradient">Kapisio</span>
          </Link>
        </div>

        {done ? (
          <Card className="text-center py-10">
            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h2 className="text-xl font-black text-fg mb-2">Şifren güncellendi!</h2>
            <p className="text-fg-muted text-sm">Oyun sayfasına yönlendiriliyorsun...</p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-primary/70" />
              </div>
              <div>
                <h1 className="text-xl font-black text-fg">Yeni Şifre Belirle</h1>
                <p className="text-sm text-fg-subtle">Güçlü bir şifre seç</p>
              </div>
            </div>

            {!sessionReady ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-fg-subtle">Kimlik doğrulanıyor...</p>
                <p className="text-xs text-fg-subtle mt-2">
                  Bağlantı gelmedi mi?{' '}
                  <Link href="/sifre-sifirla" className="text-primary hover:underline">
                    Yeniden gönder
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  type="password"
                  label="Yeni Şifre"
                  placeholder="En az 8 karakter"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  label="Yeni Şifre Tekrar"
                  placeholder="Şifreyi tekrar gir"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
                <Button type="submit" loading={loading} className="w-full btn-gradient mt-1" size="lg">
                  <Lock size={16} />
                  Şifremi Güncelle
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
