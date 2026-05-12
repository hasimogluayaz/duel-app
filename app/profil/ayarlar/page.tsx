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
import {
  User, Lock, Trash2, CheckCircle, Star, Flame, Swords,
  Camera, Gift, Copy, Check, Crown, Bell, Shield, ChevronRight,
} from 'lucide-react'
import TitleSelector from '@/components/titles/TitleSelector'
import StreakWidget from '@/components/streak/StreakWidget'
import NotificationPrefs from '@/components/notifications/NotificationPrefs'

type SettingsTab = 'profil' | 'guvenlik' | 'bildirimler' | 'referans' | 'unvanlar' | 'hesap'

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profil',      label: 'Profil',       icon: <User size={15} /> },
  { id: 'guvenlik',    label: 'Güvenlik',     icon: <Shield size={15} /> },
  { id: 'bildirimler', label: 'Bildirimler',  icon: <Bell size={15} /> },
  { id: 'referans',    label: 'Referans',     icon: <Gift size={15} /> },
  { id: 'unvanlar',    label: 'Unvanlar',     icon: <Crown size={15} /> },
  { id: 'hesap',       label: 'Hesap',        icon: <Trash2 size={15} /> },
]

export default function AyarlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profil')
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
    else toast('Profil güncellendi!', 'success')
    setSaving(false)
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) { toast('Dosya en fazla 2MB olabilir.', 'error'); return }
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
      toast(`Referans kodu uygulandı! ${data.reward} puan kazandınız`, 'success')
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
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── User header ── */}
      {profile && (
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderBottom: '1px solid var(--stroke)',
          background: 'var(--surface)',
          padding: '16px 16px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="shrink-0">
              <Avatar src={form.avatar_url || profile.avatar_url} username={profile.username} size="lg" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 16px -apple-system, sans-serif', color: 'var(--fg)' }}>{form.display_name || profile.username}</div>
              <div style={{ font: '400 12.5px monospace', color: 'var(--fg-subtle)' }}>@{profile.username}</div>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-center">
              <div>
                <div className="text-sm font-black text-fg flex items-center gap-1 justify-center">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  {formatPoints(profile.total_points)}
                </div>
                <div className="text-[11px] text-fg-subtle">puan</div>
              </div>
              {profile.streak_count > 0 && (
                <div>
                  <div className="text-sm font-black text-amber-400 flex items-center gap-1 justify-center">
                    <Flame size={11} />
                    {profile.streak_count}
                  </div>
                  <div className="text-[11px] text-fg-subtle">seri</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div role="tablist" style={{
        display: 'flex', borderBottom: '1px solid var(--stroke)',
        overflowX: 'auto', background: 'var(--surface)',
        position: 'sticky', top: 54, zIndex: 10,
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              font: `${activeTab === tab.id ? 600 : 500} 13px -apple-system, sans-serif`,
              color: tab.id === 'hesap'
                ? '#dc2626'
                : activeTab === tab.id
                  ? 'var(--fg)'
                  : 'var(--fg-subtle)',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--k-blue-500, #2a6cf0)' : 'transparent'}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
              marginLeft: tab.id === 'hesap' ? 'auto' : undefined,
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 py-6">

        {/* ─────────────────── PROFIL ─────────────────── */}
        {activeTab === 'profil' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Profil Bilgileri</h2>
              <p className="text-sm text-fg-subtle">Görünen adın, biyografin ve profil fotoğrafın</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-stroke">
                <div className="relative shrink-0">
                  <Avatar src={form.avatar_url || profile?.avatar_url} username={profile?.username || '?'} size="lg" />
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg hover:opacity-80 transition-opacity">
                    {avatarUploading
                      ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={11} className="text-white" />
                    }
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} disabled={avatarUploading} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg mb-1">Profil Fotoğrafı</p>
                  <Input
                    placeholder="ya da resim URL'si yapıştır..."
                    value={form.avatar_url}
                    onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                    type="url"
                  />
                  <p className="text-xs text-fg-subtle mt-1">Max 2MB · JPG, PNG, GIF, WebP</p>
                </div>
              </div>

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

              <Button type="submit" loading={saving} className="btn-gradient w-full">
                <CheckCircle size={15} />
                Değişiklikleri Kaydet
              </Button>
            </form>

            {/* Quick links */}
            {profile && (
              <div className="flex gap-3 pt-2">
                <a href={`/profil/${profile.username}`} className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm">
                    <User size={13} />
                    Profilimi Gör
                  </Button>
                </a>
                <a href="/oyun" className="flex-1">
                  <Button className="w-full btn-gradient" size="sm">
                    <Swords size={13} />
                    Oynamaya Git
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────── GÜVENLİK ─────────────────── */}
        {activeTab === 'guvenlik' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Güvenlik</h2>
              <p className="text-sm text-fg-subtle">Hesabını güvende tut</p>
            </div>

            <Card>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Lock size={15} className="text-primary/70" />
                </div>
                <div>
                  <p className="text-sm font-bold text-fg">Şifre Değiştir</p>
                  <p className="text-xs text-fg-subtle">En az 8 karakterli yeni bir şifre belirle</p>
                </div>
              </div>
              <form onSubmit={changePassword} className="space-y-4">
                <Input type="password" label="Mevcut Şifre" placeholder="Mevcut şifreni gir"
                  value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
                <Input type="password" label="Yeni Şifre" placeholder="En az 8 karakter"
                  value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
                <Input type="password" label="Yeni Şifre Tekrar" placeholder="Şifreyi tekrar gir"
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                <Button type="submit" loading={pwLoading} variant="secondary" className="w-full">
                  Şifreyi Güncelle
                </Button>
              </form>
            </Card>

            {/* Email info */}
            <div className="p-4 bg-surface-2 rounded-xl border border-stroke">
              <p className="text-xs font-medium text-fg-subtle uppercase tracking-wider mb-1">E-posta Adresi</p>
              <p className="text-sm text-fg">Oturum açılan e-posta adresi Supabase üzerinden yönetilir.</p>
            </div>
          </div>
        )}

        {/* ─────────────────── BİLDİRİMLER ─────────────────── */}
        {activeTab === 'bildirimler' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Bildirim Tercihleri</h2>
              <p className="text-sm text-fg-subtle">Hangi bildirimleri almak istediğini seç</p>
            </div>
            <NotificationPrefs />
          </div>
        )}

        {/* ─────────────────── REFERANS ─────────────────── */}
        {activeTab === 'referans' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Arkadaşını Davet Et</h2>
              <p className="text-sm text-fg-subtle">Her başarılı davet için her ikiniz de 100 puan kazanır</p>
            </div>

            {referralCode && (
              <Card>
                <p className="text-xs font-medium text-fg-subtle uppercase tracking-wider mb-3">Referans Kodun</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-surface-2 border border-stroke rounded-xl px-4 py-3 font-mono text-xl font-black text-primary tracking-widest text-center">
                    {referralCode}
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="p-3 rounded-xl bg-primary text-white hover:opacity-80 transition-opacity"
                    title="Kodu kopyala"
                  >
                    {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                <p className="text-xs font-medium text-fg-subtle uppercase tracking-wider mb-2">Davet Linkin</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-2 border border-stroke rounded-lg px-3 py-2 text-xs text-fg-subtle truncate font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/giris?ref=${referralCode}` : `/giris?ref=${referralCode}`}
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/giris?ref=${referralCode}`
                      navigator.clipboard.writeText(url)
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }}
                    className="p-2.5 rounded-lg bg-primary text-white hover:opacity-80 transition-opacity shrink-0"
                  >
                    {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {referralCount > 0 && (
                  <p className="text-sm text-fg-subtle mt-4 text-center">
                    Şimdiye kadar <strong className="text-amber-400">{referralCount}</strong> kişiyi davet ettin
                  </p>
                )}
              </Card>
            )}

            <Card>
              <p className="text-sm font-medium text-fg mb-1">Bir davet koduyla mı katıldın?</p>
              <p className="text-xs text-fg-subtle mb-3">Referans kodunu uygula ve puan kazan</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Referans kodunu gir"
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value.toUpperCase())}
                  className="flex-1 font-mono tracking-widest"
                  maxLength={8}
                />
                <Button onClick={applyReferral} loading={referralLoading} disabled={!referralInput.trim()} variant="secondary">
                  Uygula
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ─────────────────── UNVANLAR ─────────────────── */}
        {activeTab === 'unvanlar' && profile && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Unvanlar & Seri</h2>
              <p className="text-sm text-fg-subtle">Aktif unvanını seç, serisini koru</p>
            </div>
            <TitleSelector userId={profile.id} currentTitle={(profile as any).active_title} />
            <StreakWidget
              streak={profile.streak_count ?? 0}
              freezeCount={(profile as any).streak_freeze_count ?? 0}
              userId={profile.id}
            />
          </div>
        )}

        {/* ─────────────────── HESAP ─────────────────── */}
        {activeTab === 'hesap' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-fg mb-0.5">Hesap Yönetimi</h2>
              <p className="text-sm text-fg-subtle">Hesabınla ilgili kritik işlemler</p>
            </div>

            {/* Sign out */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-fg">Oturumu Kapat</p>
                  <p className="text-xs text-fg-subtle mt-0.5">Tüm cihazlarda oturumunu kapat</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  Çıkış
                </Button>
              </div>
            </Card>

            {/* Danger zone */}
            <div className="border border-red-500/25 rounded-2xl overflow-hidden">
              <div className="bg-red-500/8 border-b border-red-500/20 px-4 py-3 flex items-center gap-2">
                <Trash2 size={14} className="text-red-400" />
                <span className="text-sm font-bold text-red-400">Tehlikeli Bölge</span>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-fg-muted">
                  Hesabını silmek için kullanıcı adını (<strong className="text-fg">{profile?.username}</strong>) yaz.
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
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
