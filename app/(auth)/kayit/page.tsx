'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { validateUsername } from '@/lib/utils/validation'
import { CheckCircle, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const CONSENTS = [
  {
    id: 'terms',
    text: (
      <>
        <Link href="/kullanim-kosullari" target="_blank" className="text-primary hover:underline font-medium">Kullanım Koşulları</Link>
        {', '}
        <Link href="/gizlilik" target="_blank" className="text-primary hover:underline font-medium">Gizlilik</Link>
        {' ve '}
        <Link href="/cerez-politikasi" target="_blank" className="text-primary hover:underline font-medium">Çerez Politikası</Link>
        &apos;nı okudum, kabul ediyorum.
      </>
    ),
    required: true,
  },
  {
    id: 'age_ai',
    text: '13 yaşından büyüğüm; cevaplarımın eğlence amaçlı AI değerlendirmesine tabi olabileceğini anlıyorum.',
    required: true,
  },
]

export default function KayitPage() {
  const supabase = createClient()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '' })
  const [showPass, setShowPass] = useState(false)
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showGoogleConsent, setShowGoogleConsent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const allConsented = CONSENTS.every(c => consents[c.id])

  function toggleConsent(id: string) {
    setConsents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    const usernameCheck = validateUsername(form.username)
    if (!usernameCheck.valid) errs.username = usernameCheck.error!
    if (!form.email.includes('@')) errs.email = 'Geçerli bir email girin.'
    if (form.password.length < 8) errs.password = 'Şifre en az 8 karakter olmalı.'
    if (!form.display_name.trim()) errs.display_name = 'Görünen ad gerekli.'
    if (!allConsented) errs.consents = 'Kayıt olmak için tüm onayları vermeniz zorunludur.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', form.username.toLowerCase())
      .single()

    if (existing) {
      setErrors({ username: 'Bu kullanıcı adı alınmış.' })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username.toLowerCase(),
          display_name: form.display_name,
          consents_accepted_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'Bu email zaten kayıtlı.' })
      } else {
        toast('Kayıt olunamadı: ' + error.message, 'error')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogle() {
    if (!allConsented) { setShowGoogleConsent(true); return }
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://kapisio.com/auth/callback` },
    })
    if (error) {
      toast('Google ile kayıt yapılamadı.', 'error')
      setGoogleLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: form.email })
    setResendLoading(false)
    if (error) {
      toast('Email gönderilemedi. Biraz bekleyip tekrar dene.', 'error')
    } else {
      toast('Doğrulama emaili tekrar gönderildi!', 'success')
      setResendCooldown(60)
      const iv = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(iv); return 0 } return c - 1 })
      }, 1000)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-bg">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-surface border border-stroke rounded-2xl shadow-sm p-7 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-xl font-black text-fg mb-2">Neredeyse tamam! 🎉</h2>
            <p className="text-sm text-fg-muted mb-1">
              <strong className="text-fg">{form.email}</strong> adresine doğrulama emaili gönderdik.
            </p>
            <p className="text-xs text-fg-subtle mb-5">
              Emailini kontrol edip bağlantıya tıklayarak hesabını aktif et.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-amber-400 font-semibold mb-0.5">📬 Email gelmediyse</p>
              <p className="text-xs text-fg-subtle">Spam klasörünü kontrol et veya tekrar gönder.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleResend} loading={resendLoading} disabled={resendCooldown > 0} className="w-full">
                {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Doğrulama emailini tekrar gönder'}
              </Button>
              <Link href="/giris">
                <Button variant="ghost" className="w-full">Giriş sayfasına dön</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-black text-fg mb-1">Kapisio&apos;ya katıl</h1>
          <p className="text-sm text-fg-muted mb-6">Ücretsiz kaydol, oynamaya başla.</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 dark:border-stroke dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-surface-2/80 transition-colors disabled:opacity-60 shadow-sm mb-4"
          >
            <GoogleIcon />
            {googleLoading ? 'Yönlendiriliyor…' : 'Google ile Kayıt Ol'}
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
              label="İsim"
              placeholder="Adın Soyadın"
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              error={errors.display_name}
            />
            <Input
              type="email"
              label="E-posta"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Kullanıcı Adı"
              placeholder="kahraman42"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              error={errors.username}
              autoComplete="username"
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-muted">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="en az 8 karakter"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  className={cn(
                    'w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 pr-11 text-fg placeholder:text-fg-subtle',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all',
                    errors.password && 'border-red-500 focus:ring-red-500'
                  )}
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
              {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
            </div>

            {/* Consents */}
            <div className="flex flex-col gap-2">
              {CONSENTS.map(c => (
                <label key={c.id} className="flex items-start gap-2.5 cursor-pointer group">
                  <div className={cn(
                    'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    consents[c.id] ? 'bg-primary border-primary' : 'border-stroke group-hover:border-primary/70 bg-surface-2'
                  )}>
                    {consents[c.id] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <input type="checkbox" className="sr-only" checked={!!consents[c.id]} onChange={() => toggleConsent(c.id)} />
                  </div>
                  <span className="text-xs text-fg-muted leading-relaxed">{c.text}</span>
                </label>
              ))}
              {errors.consents && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={12} /> {errors.consents}
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} disabled={!allConsented} className="w-full btn-gradient" size="lg">
              Kayıt Ol
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-5 flex flex-col gap-2 text-center">
            <p className="text-sm text-fg-subtle">
              Zaten hesabın var mı?{' '}
              <Link href="/giris" className="text-primary font-semibold hover:underline">
                Giriş yap
              </Link>
            </p>
            <Link href="/" className="text-xs text-fg-subtle hover:text-fg-muted transition-colors">
              Kayıt olmadan devam et →
            </Link>
          </div>
        </div>
      </div>

      {/* Google consent overlay */}
      {showGoogleConsent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-stroke rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke flex items-center gap-3">
              <Shield size={18} className="text-primary/70 shrink-0" />
              <div>
                <p className="text-sm font-bold text-fg">Google ile devam etmeden önce</p>
                <p className="text-xs text-fg-subtle">Lütfen aşağıdaki onayları verin</p>
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              {CONSENTS.map(c => (
                <label key={c.id} className="flex items-start gap-2.5 cursor-pointer">
                  <div className={cn(
                    'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    consents[c.id] ? 'bg-primary border-primary' : 'border-stroke bg-surface-2'
                  )}>
                    {consents[c.id] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <input type="checkbox" className="sr-only" checked={!!consents[c.id]} onChange={() => toggleConsent(c.id)} />
                  </div>
                  <span className="text-xs text-fg-muted leading-relaxed">{c.text}</span>
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-stroke flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowGoogleConsent(false)} className="flex-1">
                İptal
              </Button>
              <Button
                size="sm"
                disabled={!allConsented}
                className="flex-1 btn-gradient"
                onClick={async () => {
                  if (!allConsented) return
                  setShowGoogleConsent(false)
                  setGoogleLoading(true)
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  })
                  if (error) { toast('Google ile kayıt yapılamadı.', 'error'); setGoogleLoading(false) }
                }}
              >
                Onaylıyorum, Google ile devam et
              </Button>
            </div>
          </div>
        </div>
      )}
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
