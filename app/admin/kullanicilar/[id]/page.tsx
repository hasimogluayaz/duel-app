'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  ArrowLeft, Mail, Calendar, Clock, Crown, ShieldOff, ShieldCheck,
  Trash2, Star, Swords, Heart, MessageSquare, Users, Flame,
  ExternalLink, Bot, ThumbsUp,
} from 'lucide-react'

interface UserDetail {
  profile: any
  auth: { email: string | null; lastSignIn: string | null; provider: string | null }
  counts: { answers: number; duels: number; votes: number; comments: number; followers: number; following: number }
  recentAnswers: any[]
  recentDuels: any[]
}

type Tab = 'profile' | 'answers' | 'duels'

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Next 14 vs 15 params handling: support both Promise and plain object
  const resolvedParams = typeof (params as any).then === 'function' ? (use(params as Promise<{ id: string }>)) : (params as { id: string })
  const userId = resolvedParams.id

  const toast = useToast()
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('profile')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/detail`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function patchUser(updates: any) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) { toast('İşlem başarısız.', 'error'); return }
    toast('Güncellendi!', 'success')
    if (data) setData({ ...data, profile: { ...data.profile, ...updates } })
  }

  async function deleteUser() {
    if (!confirm('Bu kullanıcıyı kalıcı olarak silmek istediğinden emin misin?')) return
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (res.ok) { toast('Kullanıcı silindi.', 'success'); window.location.href = '/admin/kullanicilar' }
    else toast('Silinemedi.', 'error')
  }

  if (loading || !data) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const { profile, auth, counts } = data

  return (
    <div className="max-w-5xl">
      <Link href="/admin/kullanicilar" className="inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-fg mb-4">
        <ArrowLeft size={12} /> Kullanıcılara dön
      </Link>

      {/* ── Profile header ──────────────────────────────────────────────── */}
      <Card className={profile.is_banned ? 'border-red-500/30 bg-red-500/5 mb-4' : 'mb-4'}>
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar src={profile.avatar_url} username={profile.username} size="xl" className="w-20 h-20" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black text-fg">{profile.display_name || profile.username}</h1>
              {profile.is_admin && <Badge variant="warning">Admin</Badge>}
              {profile.is_banned && <Badge variant="danger">Banlı</Badge>}
              {profile.is_premium && <Badge variant="default">Premium</Badge>}
            </div>
            <p className="text-sm text-fg-muted">@{profile.username}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-fg-subtle">
              {auth.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail size={11} /> <code className="font-mono">{auth.email}</code>
                </span>
              )}
              {auth.provider && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-stroke">
                  {auth.provider === 'google' ? '🇬' : auth.provider} ile giriş
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} /> {new Date(profile.created_at).toLocaleDateString('tr-TR')} kayıt
              </span>
              {auth.lastSignIn && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} /> {new Date(auth.lastSignIn).toLocaleDateString('tr-TR')} son giriş
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-xs text-fg-muted mt-3 leading-relaxed max-w-xl">{profile.bio}</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link href={`/profil/${profile.username}`} target="_blank">
              <Button size="sm" variant="ghost" className="gap-1.5 w-full">
                <ExternalLink size={13} /> Profili gör
              </Button>
            </Link>
            <Button
              size="sm"
              variant={profile.is_banned ? 'secondary' : 'ghost'}
              onClick={() => patchUser({ is_banned: !profile.is_banned })}
              className={`gap-1.5 ${profile.is_banned ? '' : 'text-red-400 hover:bg-red-500/10'}`}
            >
              {profile.is_banned ? <><ShieldCheck size={13} /> Banı kaldır</> : <><ShieldOff size={13} /> Banla</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => patchUser({ is_admin: !profile.is_admin })}
              className={`gap-1.5 ${profile.is_admin ? 'text-fg-muted' : 'text-amber-400 hover:bg-amber-500/10'}`}
            >
              <Crown size={13} /> {profile.is_admin ? 'Admin yetkisini al' : 'Admin yap'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={deleteUser}
              className="gap-1.5 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={13} /> Hesabı sil
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        <Stat label="Puan" value={profile.total_points ?? 0} icon={Star} color="text-amber-400" />
        <Stat label="Streak" value={profile.streak_count ?? 0} icon={Flame} color="text-red-400" />
        <Stat label="Cevap" value={counts.answers} icon={MessageSquare} color="text-primary" />
        <Stat label="Düello" value={counts.duels} icon={Swords} color="text-amber-500" />
        <Stat label="Verdiği Oy" value={counts.votes} icon={ThumbsUp} color="text-blue-400" />
        <Stat label="Takipçi" value={counts.followers} icon={Users} color="text-pink-400" />
        <Stat label="Takip" value={counts.following} icon={Heart} color="text-fg-muted" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-stroke mb-4">
        {([
          ['profile', 'Profil'],
          ['answers', `Cevapları (${counts.answers})`],
          ['duels', `Düelloları (${counts.duels})`],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === id ? 'border-primary text-fg' : 'border-transparent text-fg-subtle hover:text-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <DataRow label="Kullanıcı ID" value={<code className="font-mono text-xs">{profile.id}</code>} />
          <DataRow label="Email" value={auth.email ? <code className="font-mono text-xs">{auth.email}</code> : <span className="text-fg-subtle">—</span>} />
          <DataRow label="OAuth Provider" value={auth.provider ?? '—'} />
          <DataRow label="Kayıt Tarihi" value={new Date(profile.created_at).toLocaleString('tr-TR')} />
          <DataRow label="Son Giriş" value={auth.lastSignIn ? new Date(auth.lastSignIn).toLocaleString('tr-TR') : '—'} />
          <DataRow label="Son Oynama" value={profile.last_played_at ? new Date(profile.last_played_at).toLocaleString('tr-TR') : '—'} />
          <DataRow label="Kişilik Tipi" value={profile.personality_type ?? '—'} />
          <DataRow label="Streak Freeze" value={`${profile.streak_freeze_count ?? 0} adet`} />
          <DataRow label="Sezon Puanı" value={profile.season_points ?? 0} />
          <DataRow label="Haftalık Puan" value={profile.weekly_points ?? 0} />
          <DataRow label="Referral Kodu" value={profile.referral_code ? <code className="font-mono text-xs">{profile.referral_code}</code> : '—'} />
          <DataRow label="Profil Tamamlandı" value={profile.profile_complete ? '✓' : '✕'} />
        </div>
      )}

      {tab === 'answers' && (
        <div className="flex flex-col gap-2">
          {data.recentAnswers.length === 0 ? (
            <Card><p className="text-sm text-fg-muted text-center py-6">Cevap yok.</p></Card>
          ) : data.recentAnswers.map((a: any) => {
            const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
            return (
              <Card key={a.id}>
                {sc?.content && (
                  <p className="text-xs text-fg-subtle line-clamp-1 mb-1.5">
                    📅 {sc.active_date} — {sc.content}
                  </p>
                )}
                <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-fg-subtle">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <Star size={10} className="fill-amber-400" />
                    {a.vote_count ?? 0}
                  </span>
                  <span>{new Date(a.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'duels' && (
        <div className="flex flex-col gap-2">
          {data.recentDuels.length === 0 ? (
            <Card><p className="text-sm text-fg-muted text-center py-6">Düello yok.</p></Card>
          ) : data.recentDuels.map((dp: any, i: number) => {
            const d = Array.isArray(dp.duel) ? dp.duel[0] : dp.duel
            if (!d) return null
            const sc = Array.isArray(d.scenario) ? d.scenario[0] : d.scenario
            const isAi = d.judge_mode === 'ai'
            return (
              <Card key={i}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-fg-muted">{d.code}</code>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isAi ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/30 text-primary'
                  }`}>
                    {isAi ? <><Bot size={9} className="inline mr-0.5" /> AI</> : '👥 Topluluk'}
                  </span>
                  {d.winner_id && <span className="text-[10px] font-bold text-amber-400">🏆 karar verildi</span>}
                  <Link href={`/d/${d.code}`} target="_blank" className="ml-auto text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                    <ExternalLink size={11} /> Aç
                  </Link>
                </div>
                {sc?.content && (
                  <p className="text-xs text-fg-muted line-clamp-1">{sc.content}</p>
                )}
                <p className="text-[10px] text-fg-subtle mt-1">{new Date(dp.joined_at).toLocaleString('tr-TR')}</p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="p-3 rounded-xl border border-stroke bg-surface flex flex-col items-center text-center">
      <Icon size={14} className={color} />
      <p className="text-lg font-black text-fg mt-1 tabular-nums">{typeof value === 'number' ? value.toLocaleString('tr') : value}</p>
      <p className="text-[10px] text-fg-subtle mt-0.5">{label}</p>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-stroke bg-surface">
      <span className="text-xs text-fg-subtle">{label}</span>
      <span className="text-sm text-fg font-medium text-right">{value}</span>
    </div>
  )
}
