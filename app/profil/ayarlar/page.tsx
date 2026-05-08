'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { formatPoints } from '@/lib/utils/formatting'
import type { Profile } from '@/types'
import { User, Lock, Trash2, CheckCircle, Star, Flame, Swords, Camera, Gift, Copy, Check } from 'lucide-react'

export default function AyarlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '', avatar_url: '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [referralInput, setReferralInput] = useState('')
  const [referralLoading, setReferralLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const [profileRes, referralRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        fetch('/api/referral'),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        setForm({ display_name: profileRes.data.display_name ?? '', bio: profileRes.data.bio ?? '', avatar_url: profileRes.data.avatar_url ?? '' })
      }

      if (referralRes.ok) {
        const rd = await referralRes.json()
        setReferralCode(rd.referral_code)
        setReferralCount(rd.referral_count)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      })
      .eq('id', profile.id)

    if (error) toast('Profil kaydedilemedi.', 'error')
    else toast('Profil güncellendi! ✨', 'success')

    setSaving(false)
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) { toast('Dosya en fazla 2MB olabilir.', 'error'); return }
    if (!file.type.startsWith('image/')) { toast('Sadece resim dosyası yükleyebilirsin.', 'error'); return }

    setAvatarUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `avatars/${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) { toast('Yükleme başarısız: ' + uploadError.message, 'error'); setAvatarUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setForm(f => ({ ...f, avatar_url: publicUrl + '?t=' + Date.now() }))
    toast('Fotoğraf yüklendi! Kaydetmeyi unutma.', 'success')
    setAvatarUploading(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwForm.current) { toast('Mevcut şifreyi gir.', 'error'); return }
    if (pwForm.next !== pwForm.confirm) { toast('Yeni şifreler eşleşmiyor.', 'error'); return }
    if (pwForm.next.length < 8) { toast('Yeni şifre en az 8 karakter olmalı.', 'error'); return }
    setPwLoading(true)

    // Verify current password first
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const email = authUser?.email
    if (!email) { toast('Oturum hatası.', 'error'); setPwLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pwForm.current })
    if (signInError) { toast('Mevcut şifre yanlış.', 'error'); setPwLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) toast('Şifre değiştirilemedi: ' + error.message, 'error')
    else { toast('Şifre güncellendi!', 'success'); setPwForm({ current: '', next: '', confirm: '' }) }
    setPwLoading(false)
  }

  async function deleteAccount() {
    if (deleteConfirm !== profile?.username) { toast('Kullanıcı adı eşleşmiyor.', 'error'); return }
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (!res.ok) { toast('Hesap silinemedi.', 'error'); return }
    await supabase.auth.signOut()
    router.push('/')
  }

  async function applyReferral() {
    if (!referralInput.trim()) return
    setReferralLoading(true)
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: referralInput.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      toast(`Referans kodu uygulandı! ${data.reward} puan kazandınız 🎉`, 'success')
      setReferralInput('')
    } else {
      toast(data.error || 'Referans kodu uygulanamadı.', 'error')
    }
    setReferralLoading(false)
  }

  function copyReferralCode() {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* ── User summary header ──────────────────────── */}
      {profile && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-violet-600/15 via-purple-600/10 to-pink-500/15 p-5 mb-7">
          <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-purple-500/10" />
          <div className="flex items-center gap-4">
            <div className="p-1 bg-surface/60 rounded-full backdrop-blur-sm">
              <Avatar src={form.avatar_url || profile.avatar_url} username={profile.username} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-fg">{form.display_name || profile.username}</h1>
              <p className="text-sm text-fg-subtle">@{profile.username}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-center">
              <div>
                <div className="text-base font-black text-fg flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  {formatPoints(profile.total_points)}
                </div>
                <div className="text-xs text-fg-subtle">puan</div>
              </div>
              {profile.streak_count > 0 && (
                <div>
                  <div className="text-base font-black text-amber-400 flex items-center gap-1">
                    <Flame size={12} />
                    {profile.streak_count}
                  </div>
                  <div className="text-xs text-fg-subtle">seri</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Profile form ─────────────────────────────── */}
      <Card className="mb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <User size={16} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-fg">Profil Bilgileri</h2>
            <p className="text-xs text-fg-subtle">Görünen adın ve biyografin</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <Input
            label="Görünen Ad"
            placeholder="Adın Soyadın"
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            maxLength={50}
          />
          <Textarea
            label="Biyografi"
            placeholder="Kendin hakkında kısa bir şeyler yaz..."
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={160}
            charCount={form.bio.length}
            maxChars={160}
          />
          {/* Avatar upload */}
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Profil Fotoğrafı</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar src={form.avatar_url || profile?.avatar_url} username={profile?.username || '?'} size="lg" />
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer hover:bg-purple-500 transition-colors shadow-lg">
                  {avatarUploading ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={11} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={uploadAvatar}
                    disabled={avatarUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="ya da resim URL'si yapıştır..."
                  value={form.avatar_url}
                  onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                  type="url"
                />
                <p className="text-xs text-fg-subtle mt-1">Max 2MB · JPG, PNG, GIF, WebP</p>
              </div>
            </div>
          </div>
          <Button type="submit" loading={saving} className="btn-gradient">
            <CheckCircle size={16} />
            Değişiklikleri Kaydet
          </Button>
        </form>
      </Card>

      {/* ── Password change ──────────────────────────── */}
      <Card className="mb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Lock size={16} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-fg">Şifre Değiştir</h2>
            <p className="text-xs text-fg-subtle">Yeni bir şifre belirle</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <Input
            type="password"
            label="Mevcut Şifre"
            placeholder="Mevcut şifreni gir"
            value={pwForm.current}
            onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
          />
          <Input
            type="password"
            label="Yeni Şifre"
            placeholder="En az 8 karakter"
            value={pwForm.next}
            onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
          />
          <Input
            type="password"
            label="Yeni Şifre Tekrar"
            placeholder="Şifreyi tekrar gir"
            value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
          />
          <Button type="submit" loading={pwLoading} variant="secondary">
            Şifreyi Güncelle
          </Button>
        </form>
      </Card>

      {/* ── Quick links ──────────────────────────────── */}
      {profile && (
        <Card className="mb-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Swords size={16} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Hızlı Erişim</h2>
              <p className="text-xs text-fg-subtle">Profilin ve oyun sayfaları</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={`/profil/${profile.username}`} className="flex-1">
              <Button variant="secondary" className="w-full" size="sm">
                <User size={14} />
                Profilimi Gör
              </Button>
            </a>
            <a href="/oyun" className="flex-1">
              <Button className="w-full btn-gradient" size="sm">
                <Swords size={14} />
                Oynamaya Git
              </Button>
            </a>
          </div>
        </Card>
      )}

      {/* ── Referral system ─────────────────────────── */}
      <Card className="mb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Gift size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-fg">Arkadaşını Davet Et</h2>
            <p className="text-xs text-fg-subtle">Her başarılı davet için her ikiniz de 100 puan kazanır</p>
          </div>
        </div>

        {referralCode && (
          <div className="mb-5">
            <p className="text-sm text-fg-subtle mb-2">Referans kodun</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-raised border border-border rounded-xl px-4 py-3 font-mono text-lg font-black text-purple-300 tracking-widest text-center">
                {referralCode}
              </div>
              <button
                onClick={copyReferralCode}
                className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors text-white"
                title="Kodu kopyala"
              >
                {codeCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <div className="mt-3">
              <p className="text-xs text-fg-subtle mb-1">Davet linkin</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-fg-subtle truncate font-mono">
                  {typeof window !== 'undefined' ? `${window.location.origin}/giris?ref=${referralCode}` : `/giris?ref=${referralCode}`}
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/giris?ref=${referralCode}`
                    navigator.clipboard.writeText(url)
                    setCodeCopied(true)
                    setTimeout(() => setCodeCopied(false), 2000)
                  }}
                  className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-white shrink-0"
                >
                  {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            {referralCount > 0 && (
              <p className="text-xs text-fg-subtle mt-2 text-center">
                🎉 Şimdiye kadar <strong className="text-amber-400">{referralCount}</strong> kişiyi davet ettin
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-sm text-fg-subtle mb-2">Bir referans koduyla mı katıldın?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Referans kodunu gir"
              value={referralInput}
              onChange={e => setReferralInput(e.target.value.toUpperCase())}
              className="flex-1 font-mono tracking-widest"
              maxLength={8}
            />
            <Button
              onClick={applyReferral}
              loading={referralLoading}
              disabled={!referralInput.trim()}
              variant="secondary"
            >
              Uygula
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Danger zone ──────────────────────────────── */}
      <Card className="border-red-500/20">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-400">Tehlikeli Bölge</h2>
            <p className="text-xs text-fg-subtle">Bu işlemler geri alınamaz</p>
          </div>
        </div>
        <p className="text-sm text-fg-muted mb-4">
          Hesabını silmek için kullanıcı adını (<strong className="text-fg">{profile?.username}</strong>) yazman gerekiyor.
          Tüm verilerinin kalıcı olarak silineceğini unutma.
        </p>
        <div className="flex gap-3">
          <Input
            placeholder={`${profile?.username} yaz`}
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="danger"
            disabled={deleteConfirm !== profile?.username}
            onClick={deleteAccount}
          >
            Sil
          </Button>
        </div>
      </Card>
    </div>
  )
}
