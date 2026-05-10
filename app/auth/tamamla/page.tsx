'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validateUsername } from '@/lib/utils/validation'
import { CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function TamamlaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<{
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
  } | null>(null)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const u = res.data.user
      if (!u) { router.replace('/giris'); return }

      // If already complete, skip this page
      if (u.user_metadata?.profile_complete !== false) {
        router.replace('/oyun')
        return
      }

      setUser({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name,
        avatar_url: u.user_metadata?.avatar_url,
      })
      setDisplayName(u.user_metadata?.full_name || '')
      setInitializing(false)
    })
  }, [])

  const checkUsername = useCallback(async (value: string) => {
    const validation = validateUsername(value)
    if (!validation.valid) {
      setUsernameStatus('invalid')
      setUsernameError(validation.error || 'Geçersiz kullanıcı adı')
      return
    }

    setUsernameStatus('checking')
    setUsernameError('')

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value.toLowerCase())
      .neq('id', user?.id || '')
      .maybeSingle()

    setUsernameStatus(data ? 'taken' : 'available')
    if (data) setUsernameError('Bu kullanıcı adı alınmış.')
  }, [user?.id])

  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return }
    const t = setTimeout(() => checkUsername(username), 500)
    return () => clearTimeout(t)
  }, [username, checkUsername])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (usernameStatus !== 'available' || !displayName.trim() || !user) return

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase(),
        display_name: displayName.trim(),
        profile_complete: true,
      })
      .eq('id', user.id)

    if (error) {
      setLoading(false)
      setUsernameError('Kaydedilemedi. Tekrar dene.')
      return
    }

    // Update JWT metadata so middleware allows through
    await supabase.auth.updateUser({ data: { profile_complete: true } })

    router.replace('/oyun')
  }

  if (initializing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader size={24} className="animate-spin text-fg-subtle" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name || ''}
              width={72}
              height={72}
              className="w-18 h-18 rounded-full mx-auto mb-4 ring-2 ring-primary/30"
            />
          ) : (
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black">
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
            <CheckCircle size={12} />
            Google ile bağlandı
          </div>
          <h1 className="text-2xl font-black text-fg mb-1">Son bir adım! ✨</h1>
          <p className="text-fg-muted text-sm">Kapisio&apos;da kendine özgü bir kullanıcı adı seç</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Username field */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1.5">
              Kullanıcı Adı <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="kullaniciadın"
                maxLength={20}
                className="w-full pl-7 pr-10 py-2.5 rounded-xl border border-stroke bg-surface-2 text-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
                autoComplete="username"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader size={14} className="animate-spin text-fg-subtle" />}
                {usernameStatus === 'available' && <CheckCircle size={14} className="text-green-400" />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle size={14} className="text-red-400" />}
              </div>
            </div>
            {usernameStatus === 'available' && (
              <p className="text-xs text-green-400 mt-1.5">@{username} müsait!</p>
            )}
            {usernameError && (
              <p className="text-xs text-red-400 mt-1.5">{usernameError}</p>
            )}
            <p className="text-xs text-fg-subtle mt-1">3-20 karakter, harf, rakam ve alt çizgi (_)</p>
          </div>

          {/* Display name */}
          <Input
            label="Görünen Ad"
            placeholder="Tam adın veya takma adın"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={50}
          />

          <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-primary/70 mt-0.5 shrink-0" />
              <p className="text-xs text-fg-subtle">
                Kullanıcı adın profilinde ve liderlik tablosunda görünür. Sonradan <span className="text-fg-muted font-medium">Ayarlar</span>&apos;dan değiştirebilirsin.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={usernameStatus !== 'available' || !displayName.trim()}
            className="w-full btn-gradient"
            size="lg"
          >
            Kapisio&apos;ya Katıl 🎉
          </Button>
        </form>
      </div>
    </div>
  )
}
