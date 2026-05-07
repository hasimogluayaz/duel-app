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
import { User, Lock, Trash2, CheckCircle, Star, Flame, Swords } from 'lucide-react'

export default function AyarlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '', avatar_url: '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({ display_name: data.display_name ?? '', bio: data.bio ?? '', avatar_url: data.avatar_url ?? '' })
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
          <Input
            label="Avatar URL"
            placeholder="https://... (bir resim linki)"
            value={form.avatar_url}
            onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
            type="url"
          />
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
