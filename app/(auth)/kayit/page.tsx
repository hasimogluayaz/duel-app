'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { validateUsername } from '@/lib/utils/validation'
import { CheckCircle, Sparkles, Shield, Swords, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

// Zorunlu onay kutucukları — hepsi işaretlenmeden form submit edilemiyor
const CONSENTS = [
  {
    id: 'terms',
    text: (
      <>
        <Link href="/kullanim-kosullari" target="_blank" className="text-primary hover:underline font-medium">Kullanım Koşulları</Link>
        &apos;nı okudum ve kabul ediyorum. Platformun yalnızca eğlence amaçlı olduğunu,
        hakaret/ırkçılık/şiddet içeren içerik paylaşımının yasak olduğunu ve bu kurallara
        aykırı davranmam halinde hesabımın askıya alınabileceğini anlıyorum.
      </>
    ),
    required: true,
  },
  {
    id: 'privacy',
    text: (
      <>
        <Link href="/gizlilik" target="_blank" className="text-primary hover:underline font-medium">Gizlilik Politikası</Link>
        &apos;nı ve{' '}
        <Link href="/cerez-politikasi" target="_blank" className="text-primary hover:underline font-medium">Çerez Politikası</Link>
        &apos;nı okudum. E-posta adresim, kullanıcı adım ve oyun içi cevaplarımın
        Supabase (AB, Frankfurt) altyapısında saklanmasına; Vercel ve Anthropic Claude
        (ABD) servisleri aracılığıyla işlenmesine açık rıza veriyorum.
      </>
    ),
    required: true,
  },
  {
    id: 'age',
    text: '13 yaşından büyük olduğumu beyan ederim. 18 yaşından küçüksem ebeveyn/vasi onayı aldığımı kabul ediyorum.',
    required: true,
  },
  {
    id: 'content',
    text: 'Platform üzerinde paylaştığım içeriklerin (cevaplar, profil bilgileri) yasal sorumluluğunun tamamen bana ait olduğunu, Kapisio\'nun kullanıcı içeriklerinden sorumlu tutulamayacağını kabul ediyorum.',
    required: true,
  },
  {
    id: 'ai',
    text: 'Yazdığım cevapların AI değerlendirmesi için Anthropic Claude API\'ye gönderileceğini, AI\'nın verdiği sonuçların (kazanan, roast, kişilik tipi) eğlence amaçlı olup hukuki bağlayıcılığı bulunmadığını anlıyorum.',
    required: true,
  },
]

export default function KayitPage() {
  const supabase = createClient()
  const toast = useToast()

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
  })
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showGoogleConsent, setShowGoogleConsent] = useState(false)

  const allConsented = CONSENTS.every(c => consents[c.id])

  function toggleConsent(id: string) {
    setConsents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function acceptAll() {
    const all: Record<string, boolean> = {}
    CONSENTS.forEach(c => { all[c.id] = true })
    setConsents(all)
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
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

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

    const { data, error } = await supabase.auth.signUp({
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

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: form.username.toLowerCase(),
        display_name: form.display_name,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogle() {
    if (!allConsented) {
      setShowGoogleConsent(true)
      return
    }
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast('Google ile kayıt yapılamadı.', 'error')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-bg">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-fg mb-3">Neredeyse tamam! 🎉</h2>
          <p className="text-fg-muted text-sm mb-2">
            <strong className="text-fg">{form.email}</strong> adresine doğrulama emaili gönderdik.
          </p>
          <p className="text-fg-subtle text-sm mb-8">
            Emailini kontrol edip bağlantıya tıklayarak hesabını aktif et.
          </p>
          <Link href="/giris">
            <Button variant="outline" className="w-full">Giriş sayfasına dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-pink-500 via-purple-600 to-violet-700 p-12 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-white">
            <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain brightness-0 invert" />
            Kapisio
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black leading-tight mb-3">
              Topluluğa katıl! 🔥
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Hemen ücretsiz hesap oluştur ve dünya genelindeki oyuncularla yarışmaya başla.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Sparkles size={20} />, title: 'Ücretsiz', desc: 'Sınırsız oyun, sıfır ödeme' },
              { icon: <Swords size={20} />, title: 'Günlük Meydan Okumalar', desc: 'Her gün yeni senaryolar' },
              { icon: <Shield size={20} />, title: 'Güvenli', desc: 'Verileriniz şifrelenerek korunur' },
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-bg overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-black text-2xl text-fg">
              <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="text-gradient">Kapisio</span>
            </Link>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-black text-fg mb-1">Hesap Oluştur ✨</h1>
            <p className="text-fg-muted text-sm">Ücretsiz kaydol, düelloya katıl</p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 dark:border-stroke dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl py-3 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-surface-2/80 transition-colors disabled:opacity-60 shadow-sm mb-5"
          >
            <GoogleIcon />
            {googleLoading ? 'Yönlendiriliyor...' : 'Google ile Kayıt Ol'}
          </button>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-xs text-fg-subtle font-medium">veya email ile</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Kullanıcı Adı"
                placeholder="kahraman42"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                error={errors.username}
                autoComplete="username"
              />
              <Input
                label="Görünen Ad"
                placeholder="Adın"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                error={errors.display_name}
              />
            </div>
            <Input
              type="email"
              label="Email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              type="password"
              label="Şifre"
              placeholder="En az 8 karakter"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={errors.password}
              autoComplete="new-password"
            />

            {/* Consent checkboxes */}
            <ConsentBlock
              consents={consents}
              onToggle={toggleConsent}
              onAcceptAll={acceptAll}
              error={errors.consents}
            />

            <Button
              type="submit"
              loading={loading}
              disabled={!allConsented}
              className="w-full"
              size="lg"
            >
              Hesap Oluştur
            </Button>
          </form>

          {/* Google consent overlay */}
          {showGoogleConsent && (
            <GoogleConsentModal
              consents={consents}
              onToggle={toggleConsent}
              onAcceptAll={acceptAll}
              onConfirm={async () => {
                if (!allConsented) return
                setShowGoogleConsent(false)
                setGoogleLoading(true)
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                })
                if (error) { toast('Google ile kayıt yapılamadı.', 'error'); setGoogleLoading(false) }
              }}
              onCancel={() => setShowGoogleConsent(false)}
              allConsented={allConsented}
            />
          )}

          <p className="text-center text-sm text-fg-subtle mt-5">
            Zaten hesabın var mı?{' '}
            <Link href="/giris" className="text-primary hover:text-primary-dark font-semibold transition-colors">
              Giriş Yap →
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

// ── Shared consent UI ──────────────────────────────────────────────────────

interface ConsentProps {
  consents: Record<string, boolean>
  onToggle: (id: string) => void
  onAcceptAll: () => void
  error?: string
}

function ConsentBlock({ consents, onToggle, onAcceptAll, error }: ConsentProps) {
  const allChecked = CONSENTS.every(c => consents[c.id])

  return (
    <div className="flex flex-col gap-2">
      {/* Hepsini kabul et shortcut */}
      {!allChecked && (
        <button
          type="button"
          onClick={onAcceptAll}
          className="w-full text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-500/60 rounded-xl py-2 px-3 transition-colors text-left flex items-center gap-2"
        >
          <CheckCircle size={14} />
          Tümünü kabul et (zorunlu onaylar)
        </button>
      )}

      <div className="flex flex-col gap-2.5 bg-surface border border-stroke rounded-xl p-3">
        {CONSENTS.map(c => (
          <label key={c.id} className="flex items-start gap-3 cursor-pointer group">
            <div className={cn(
              'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
              consents[c.id]
                ? 'bg-purple-600 border-purple-600'
                : 'border-stroke group-hover:border-purple-500/60 bg-surface-2'
            )}>
              {consents[c.id] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <input
                type="checkbox"
                className="sr-only"
                checked={!!consents[c.id]}
                onChange={() => onToggle(c.id)}
                required={c.required}
              />
            </div>
            <span className="text-xs text-fg-muted leading-relaxed">{c.text}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  )
}

function GoogleConsentModal({
  consents,
  onToggle,
  onAcceptAll,
  onConfirm,
  onCancel,
  allConsented,
}: ConsentProps & { onConfirm: () => void; onCancel: () => void; allConsented: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-stroke rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke flex items-center gap-3">
          <Shield size={18} className="text-purple-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-fg">Google ile devam etmeden önce</p>
            <p className="text-xs text-fg-subtle">Lütfen aşağıdaki onayları verin</p>
          </div>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <ConsentBlock consents={consents} onToggle={onToggle} onAcceptAll={onAcceptAll} />
        </div>
        <div className="px-5 py-4 border-t border-stroke flex gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">
            İptal
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!allConsented}
            className="flex-1 btn-gradient"
          >
            Onaylıyorum, Google ile devam et
          </Button>
        </div>
      </div>
    </div>
  )
}
