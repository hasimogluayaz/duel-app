'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Eye, EyeOff } from 'lucide-react'

export default function GirisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-fg-subtle text-sm">Yükleniyor…</div>
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
  const [showPass, setShowPass] = useState(false)
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
        toast(
          error.message === 'Invalid login credentials'
            ? 'Email veya şifre hatalı.'
            : 'Giriş yapılamadı. Tekrar dene.',
          'error'
        )
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
      options: { redirectTo: `https://kapisio.com/auth/callback?next=${redirect}` },
    })
    if (error) {
      toast('Google ile giriş yapılamadı.', 'error')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Kapisio" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="font-black text-2xl text-gradient">Kapisio</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-surface border border-stroke rounded-2xl shadow-sm p-7">
          <h1 className="text-xl font-black text-fg mb-1">Tekrar hoş geldin</h1>
          <p className="text-sm text-fg-muted mb-6">Hesabına giriş yap.</p>

          {callbackError === 'auth_callback' && (
            <div className="mb-4 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5 text-xs text-red-400">
              Giriş sırasında bir hata oluştu. Tekrar dene.
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 dark:border-stroke dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-surface-2/80 transition-colors disabled:opacity-60 shadow-sm mb-4"
          >
            <GoogleIcon />
            {googleLoading ? 'Yönlendiriliyor…' : 'Google ile Giriş Yap'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-xs text-fg-subtle font-medium">— veya —</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <Input
              type="email"
              label="E-posta"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-muted">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 pr-11 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/sifre-sifirla" className="text-xs text-primary hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full btn-gradient mt-1" size="lg">
              Giriş Yap
            </Button>
          </form>

          {/* Unconfirmed email */}
          {unconfirmedEmail && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-400 mb-1">📧 Email doğrulanmadı</p>
              <p className="text-xs text-fg-subtle mb-3">
                <strong className="text-fg">{unconfirmedEmail}</strong> adresine doğrulama emaili gönderildi.
              </p>
              {resendSent ? (
                <p className="text-xs text-green-400 font-medium">✓ Tekrar gönderildi!</p>
              ) : (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  {resendLoading ? 'Gönderiliyor…' : 'Doğrulama emailini tekrar gönder →'}
                </button>
              )}
            </div>
          )}

          {/* Footer links */}
          <div className="mt-5 flex flex-col gap-2 text-center">
            <p className="text-sm text-fg-subtle">
              Hesabın yok mu?{' '}
              <Link href="/kayit" className="text-primary font-semibold hover:underline">
                Kayıt ol
              </Link>
            </p>
            <Link href="/" className="text-xs text-fg-subtle hover:text-fg-muted transition-colors">
              Kayıt olmadan devam et →
            </Link>
          </div>
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
