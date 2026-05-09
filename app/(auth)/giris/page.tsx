'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Swords, Trophy, Users } from 'lucide-react'
import Image from 'next/image'

export default function GirisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-fg-subtle">Yükleniyor...</div>
      </div>
    }>
      <GirisForm />
    </Suspense>
  )
}

function GirisForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const toast = useToast()
  const redirect = searchParams.get('redirect') || '/oyun'
  const callbackError = searchParams.get('error')

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(form.email)
      } else {
        toast(error.message === 'Invalid login credentials'
          ? 'Email veya şifre hatalı.'
          : 'Giriş yapılamadı. Tekrar dene.', 'error')
      }
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  async function handleResendConfirmation() {
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: unconfirmedEmail })
    setResendLoading(false)
    if (!error) setResendSent(true)
    else toast('Email gönderilemedi. Biraz bekle ve tekrar dene.', 'error')
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://kapisio.com/auth/callback?next=${redirect}`,
      },
    })
    if (error) {
      toast('Google ile giriş yapılamadı.', 'error')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-white">
            <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain brightness-0 invert" />
            Kapisio
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black leading-tight mb-3">
              Düelloya hazır mısın?
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Günlük senaryolara cevap ver, arkadaşlarınla yarış ve liderlik tablosuna çık!
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Swords size={20} />, title: 'Günlük Düellolar', desc: 'Her gün yeni senaryolar seni bekliyor' },
              { icon: <Trophy size={20} />, title: 'Liderlik Tablosu', desc: 'En iyi oyunculara meydan oku' },
              { icon: <Users size={20} />, title: 'Topluluk', desc: 'Binlerce oyuncuyla yarış' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-white/70 text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-xs">© 2025 Kapisio · Yapay zeka destekli</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-bg">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-black text-2xl text-fg">
              <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="text-gradient">Kapisio</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-fg mb-1">Hoş geldin! 👋</h1>
            <p className="text-fg-muted text-sm">Hesabına giriş yap ve düelloya katıl</p>
            {callbackError === 'auth_callback' && (
              <div className="mt-3 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5 text-xs text-red-400">
                Giriş sırasında bir hata oluştu. Tekrar dene.
              </div>
            )}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 dark:border-stroke dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl py-3 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-surface-2/80 transition-colors disabled:opacity-60 shadow-sm mb-5"
          >
            <GoogleIcon />
            {googleLoading ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}
          </button>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-xs text-fg-subtle font-medium">veya email ile</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
            <div>
              <Input
                type="password"
                label="Şifre"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/sifre-sifirla" className="text-xs text-primary hover:text-primary-dark transition-colors">
                  Şifremi unuttum
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Giriş Yap
            </Button>
          </form>

          {/* Email not confirmed banner */}
          {unconfirmedEmail && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-400 mb-1">📧 Email doğrulanmadı</p>
              <p className="text-xs text-fg-subtle mb-3">
                <strong className="text-fg">{unconfirmedEmail}</strong> adresine gönderilen doğrulama emailini kontrol et. Spam klasörüne düşmüş olabilir.
              </p>
              {resendSent ? (
                <p className="text-xs text-green-400 font-medium">✓ Doğrulama emaili tekrar gönderildi!</p>
              ) : (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  {resendLoading ? 'Gönderiliyor...' : 'Doğrulama emailini tekrar gönder →'}
                </button>
              )}
            </div>
          )}

          <p className="text-center text-sm text-fg-subtle mt-6">
            Hesabın yok mu?{' '}
            <Link href="/kayit" className="text-primary hover:text-primary-dark font-semibold transition-colors">
              Ücretsiz Kayıt Ol →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
