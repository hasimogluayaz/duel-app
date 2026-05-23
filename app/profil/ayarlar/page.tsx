'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import type { Profile } from '@/types'
import {
  User, Lock, Trash2, Bell, ChevronRight, Sun, Moon, Monitor, LogOut, Crown, CreditCard,
} from 'lucide-react'
import { isPremiumActive } from '@/lib/premium/check'
import NotificationPrefs from '@/components/notifications/NotificationPrefs'

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 38, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer',
      background: on ? 'var(--k-blue-500, #2a6cf0)' : 'var(--k-slate-200, #d6dae3)',
      position: 'relative', transition: 'background .15s', padding: 0, flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}

// ─── Setting row ──────────────────────────────────────────────────────────────
function SettingRow({ icon, label, hint, right, onClick, danger, last }: {
  icon?: React.ReactNode
  label: string
  hint?: string
  right?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  last?: boolean
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderBottom: last ? 'none' : '1px solid var(--stroke, #e4e7ed)',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {icon && (
        <span style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: danger ? 'color-mix(in oklab, #dc2626 12%, white)' : 'var(--surface-2, #f0f2f5)',
          color: danger ? '#dc2626' : 'var(--fg-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 14px -apple-system, sans-serif', color: danger ? '#dc2626' : 'var(--fg)' }}>{label}</div>
        {hint && <div style={{ marginTop: 2, font: '400 12px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>{hint}</div>}
      </div>
      {right}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      font: '600 11px -apple-system, sans-serif',
      color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.07em',
      marginBottom: 8, paddingLeft: 2,
    }}>{children}</div>
  )
}

function SCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--stroke, #e4e7ed)',
      borderRadius: 14, overflow: 'hidden',
    }}>{children}</div>
  )
}

export default function AyarlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const { theme, setTheme } = useTheme()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [form, setForm] = useState({ display_name: '' })
  const [saving, setSaving] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({ display_name: data.display_name ?? '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles')
      .update({ display_name: form.display_name || null })
      .eq('id', profile.id)
    toast(error ? 'Profil kaydedilemedi.' : 'Profil güncellendi!', error ? 'error' : 'success')
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { toast('Şifreler eşleşmiyor.', 'error'); return }
    if (pwForm.next.length < 8) { toast('En az 8 karakter.', 'error'); return }
    setPwLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) { toast('Oturum hatası.', 'error'); setPwLoading(false); return }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: authUser.email, password: pwForm.current })
    if (signInError) { toast('Mevcut şifre yanlış.', 'error'); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    toast(error ? 'Şifre değiştirilemedi.' : 'Şifre güncellendi!', error ? 'error' : 'success')
    if (!error) setPwForm({ current: '', next: '', confirm: '' })
    setPwLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 10, border: '1px solid var(--stroke)',
    background: 'var(--surface-2)', color: 'var(--fg)',
    font: '400 14px -apple-system, sans-serif', outline: 'none', width: '100%',
  }

  // ── Profil düzenle ──
  if (section === 'profil') return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
      <button onClick={() => setSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, font: '500 14px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>← Geri</button>
      <h2 style={{ margin: 0, font: '700 18px -apple-system, sans-serif', color: 'var(--fg)' }}>Profil Bilgileri</h2>
      <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ font: '500 13px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>Görünen Ad</label>
          <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            maxLength={50} placeholder="Adın Soyadın" style={inputStyle} />
        </div>
        <button type="submit" disabled={saving} style={{
          padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #1442a8, #2a6cf0)', color: '#fff',
          font: '600 14px -apple-system, sans-serif', opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</button>
      </form>
    </div>
  )

  // ── Şifre değiştir ──
  if (section === 'sifre') return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
      <button onClick={() => setSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, font: '500 14px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>← Geri</button>
      <h2 style={{ margin: 0, font: '700 18px -apple-system, sans-serif', color: 'var(--fg)' }}>Şifre Değiştir</h2>
      <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Mevcut Şifre', key: 'current' as const, ph: 'Mevcut şifreni gir' },
          { label: 'Yeni Şifre', key: 'next' as const, ph: 'En az 8 karakter' },
          { label: 'Yeni Şifre Tekrar', key: 'confirm' as const, ph: 'Şifreyi tekrar gir' },
        ].map(f => (
          <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ font: '500 13px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>{f.label}</label>
            <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inputStyle} />
          </div>
        ))}
        <button type="submit" disabled={pwLoading} style={{
          padding: '11px', borderRadius: 10, border: '1px solid var(--stroke)', cursor: 'pointer',
          background: 'var(--surface)', color: 'var(--fg)',
          font: '600 14px -apple-system, sans-serif', opacity: pwLoading ? 0.7 : 1,
        }}>{pwLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</button>
      </form>
    </div>
  )

  // ── Bildirim tercihleri ──
  if (section === 'bildirimler') return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
      <button onClick={() => setSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, font: '500 14px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>← Geri</button>
      <h2 style={{ margin: 0, font: '700 18px -apple-system, sans-serif', color: 'var(--fg)' }}>Bildirim Tercihleri</h2>
      <NotificationPrefs />
    </div>
  )

  // ── Ana ayarlar görünümü ──
  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <h1 style={{ margin: 0, font: '700 22px -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
        Ayarlar
      </h1>

      {/* Profil kartı */}
      {profile && (
        <SCard>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar src={profile.avatar_url} username={profile.username} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 16px -apple-system, sans-serif', color: 'var(--fg)' }}>
                {profile.display_name || profile.username}
              </div>
              <div style={{ font: '400 12.5px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>
                @{profile.username}
              </div>
            </div>
            <button
              onClick={() => setSection('profil')}
              style={{
                padding: '6px 14px', height: 32, borderRadius: 999,
                border: '1px solid var(--stroke)', background: 'var(--surface)',
                color: 'var(--fg-muted)', font: '500 12.5px -apple-system, sans-serif', cursor: 'pointer',
              }}
            >Düzenle</button>
          </div>
        </SCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Görünüm — tema seçici (next-themes ile bağlı) */}
        <div>
          <SectionTitle>Görünüm</SectionTitle>
          <SCard>
            <div style={{ padding: 14 }}>
              <div style={{ font: '500 13px -apple-system, sans-serif', color: 'var(--fg-muted)', marginBottom: 10 }}>Tema</div>
              {mounted && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {([
                    { id: 'light', label: 'Açık', bg: '#f7f8fa', fg: '#0f1320' },
                    { id: 'dark',  label: 'Koyu', bg: '#0f1320', fg: '#f7f8fa' },
                    { id: 'system', label: 'Sistem', bg: 'linear-gradient(90deg,#f7f8fa 50%,#0f1320 50%)', fg: '#646c7e' },
                  ] as const).map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} style={{
                      padding: 0, height: 56, borderRadius: 10, cursor: 'pointer',
                      background: t.bg, position: 'relative', overflow: 'hidden',
                      border: `2px solid ${theme === t.id ? 'var(--k-blue-500,#2a6cf0)' : 'var(--stroke,#e4e7ed)'}`,
                      transition: 'border-color .12s',
                    }}>
                      <span style={{
                        position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center',
                        font: '600 11px -apple-system, sans-serif', color: t.fg,
                      }}>{t.label}</span>
                      {theme === t.id && (
                        <span style={{
                          position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%',
                          background: 'var(--k-blue-500,#2a6cf0)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900,
                        }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SCard>
        </div>

        {/* Bildirimler */}
        <div>
          <SectionTitle>Bildirimler</SectionTitle>
          <SCard>
            <SettingRow
              icon={<Bell size={16} />}
              label="Bildirim tercihleri"
              hint="Hangi bildirimleri alacağını seç"
              right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
              onClick={() => setSection('bildirimler')}
              last
            />
          </SCard>
        </div>

        {/* Premium */}
        <div>
          <SectionTitle>Premium</SectionTitle>
          <SCard>
            {isPremiumActive(profile as any) ? (
              <>
                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--stroke)' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Crown size={16} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '700 14px -apple-system, sans-serif', color: 'var(--fg)' }}>Premium aktif ⚡</div>
                    {(profile as any)?.premium_until && (
                      <div style={{ font: '400 11px -apple-system, sans-serif', color: 'var(--fg-subtle)', marginTop: 2 }}>
                        Yenileme: {new Date((profile as any).premium_until).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>
                <SettingRow
                  icon={<CreditCard size={16} />}
                  label="Aboneliği yönet"
                  hint="Faturalama ve iptal"
                  right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
                  onClick={async () => {
                    const res = await fetch('/api/stripe/portal', { method: 'POST' })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                    else toast(data.error ?? 'Portal açılamadı.', 'error')
                  }}
                  last
                />
              </>
            ) : (
              <SettingRow
                icon={<Crown size={16} />}
                label="Premium'a geç"
                hint="Sınırsız düello, streak freeze, AI analiz"
                right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
                onClick={() => router.push('/premium')}
                last
              />
            )}
          </SCard>
        </div>

        {/* Hesap */}
        <div>
          <SectionTitle>Hesap</SectionTitle>
          <SCard>
            <SettingRow
              icon={<User size={16} />}
              label="Profili düzenle"
              hint="Görünen adını güncelle"
              right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
              onClick={() => setSection('profil')}
            />
            <SettingRow
              icon={<Lock size={16} />}
              label="Şifre değiştir"
              right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
              onClick={() => setSection('sifre')}
            />
            <SettingRow
              icon={<LogOut size={16} />}
              label="Oturumu kapat"
              right={<ChevronRight size={16} style={{ color: 'var(--fg-subtle)' }} />}
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            />
            <SettingRow
              icon={<Trash2 size={16} />}
              label="Hesabı sil"
              hint="Bu işlem geri alınamaz"
              danger
              right={<ChevronRight size={16} style={{ color: '#dc2626' }} />}
              onClick={() => router.push('/profil/ayarlar/hesap-sil')}
              last
            />
          </SCard>
        </div>
      </div>

      <p style={{ font: '400 12px Geist Mono, monospace', color: 'var(--fg-subtle)', textAlign: 'center', paddingBottom: 8 }}>
        Kapisio · KVKK uyumlu · SSL korumalı
      </p>
    </div>
  )
}
