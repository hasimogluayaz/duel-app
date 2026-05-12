'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import type { Notification } from '@/types'
import { Bell, Swords, ArrowUp, Trophy, User, Settings2 } from 'lucide-react'
import Link from 'next/link'

// ─── Universal URL resolver ───────────────────────────────────────────────────
function getNotificationUrl(n: Notification): string | null {
  const data = (n as any).data ?? {}
  switch (n.type) {
    case 'duel_invite':
    case 'duel_result':
    case 'duel_accepted':
      if (data.share_token) return `/duel/${data.share_token}`
      if (data.duel_id)     return `/duel/${data.duel_id}`
      return null
    case 'vote_milestone':
      if (data.duel_id) return `/duel/${data.duel_id}`
      return null
    case 'new_follower':
      if (data.follower_username) return `/profil/${data.follower_username}`
      return null
    case 'new_comment':
    case 'comment_reply':
    case 'answer_comment':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    case 'reaction_milestone':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    case 'streak_milestone':
    case 'streak_reminder':
    case 'weekly_mission_complete':
      return '/oyun'
    case 'achievement':
    case 'tier_up':
      return '/basarimlar'
    case 'vote_received':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    default:
      return null
  }
}

// ─── Notification icon ────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    duel_invite:   { icon: <Swords size={15} />, color: 'var(--k-blue-500, #2a6cf0)' },
    duel_result:   { icon: <Trophy size={15} />, color: 'var(--k-sky-500, #1f8df0)' },
    duel_accepted: { icon: <Swords size={15} />, color: '#16a34a' },
    vote_received: { icon: <ArrowUp size={15} />, color: '#16a34a' },
    vote_milestone:{ icon: <ArrowUp size={15} />, color: '#16a34a' },
    new_follower:  { icon: <User size={15} />, color: 'var(--k-blue-500, #2a6cf0)' },
    achievement:   { icon: <Trophy size={15} />, color: 'var(--k-sky-500, #1f8df0)' },
    tier_up:       { icon: <Trophy size={15} />, color: 'var(--k-blue-500, #2a6cf0)' },
  }
  const m = map[type] ?? { icon: <Bell size={15} />, color: 'var(--k-blue-500, #2a6cf0)' }
  return (
    <span style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: `color-mix(in oklab, ${m.color} 14%, white)`,
      color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {m.icon}
    </span>
  )
}

// ─── Group type ───────────────────────────────────────────────────────────────
const TYPE_GROUP: Record<string, string> = {
  duel_invite: 'duel', duel_result: 'duel', duel_accepted: 'duel',
  new_follower: 'follow', vote_received: 'vote', vote_milestone: 'vote',
  new_comment: 'mention', comment_reply: 'mention', answer_comment: 'mention',
}

export default function BildirimlerPage() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'duel' | 'mention'>('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(data ?? [])
      setLoading(false)
      supabase.from('notifications').update({ is_read: true })
        .eq('user_id', user.id).eq('is_read', false).then(() => {})
    }
    load()
  }, [])

  async function markAllRead() {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id).then(() => {})
    }
    const url = getNotificationUrl(n)
    if (url) router.push(url)
  }

  const unread = notifications.filter(n => !n.is_read).length

  const filtered = tab === 'all'
    ? notifications
    : notifications.filter(n => TYPE_GROUP[n.type] === tab)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, font: '700 22px -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
          Bildirimler
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{
              padding: '6px 12px', height: 32, borderRadius: 999, border: 'none',
              background: 'transparent', color: 'var(--k-blue-500, #2a6cf0)',
              font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
            }}>
              Tümünü okundu say
            </button>
          )}
          <Link href="/profil/ayarlar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--stroke, #e4e7ed)',
            color: 'var(--fg-muted)', background: 'transparent' }}>
            <Settings2 size={15} />
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {([
          { id: 'all', label: 'Tümü' },
          { id: 'duel', label: 'Düellolar' },
          { id: 'mention', label: 'Bahsetmeler' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 999,
            border: `1px solid ${tab === t.id ? 'transparent' : 'var(--stroke, #e4e7ed)'}`,
            background: tab === t.id ? 'var(--fg, #0f1320)' : 'var(--surface, #fff)',
            color: tab === t.id ? '#fff' : 'var(--fg-muted)',
            font: '500 13px -apple-system, sans-serif', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
        }}>
          <Bell size={32} style={{ color: 'var(--fg-subtle)', opacity: 0.4, margin: '0 auto 12px' }} />
          <p style={{ margin: 0, font: '600 15px -apple-system, sans-serif', color: 'var(--fg)' }}>Bildirim yok</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-subtle)' }}>Düelloya gir, oylanmaya başla!</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface, #fff)', border: '1px solid var(--stroke, #e4e7ed)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {filtered.map((n, i) => {
            const url = getNotificationUrl(n)
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                  borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--stroke, #e4e7ed)',
                  background: !n.is_read ? 'var(--k-blue-50, #eef4ff)' : 'transparent',
                  cursor: url ? 'pointer' : 'default',
                  transition: 'background .1s',
                }}
              >
                <NotifIcon type={n.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '400 14px -apple-system, sans-serif', color: 'var(--fg, #0f1320)' }}>
                    <strong>{n.title}</strong>
                  </div>
                  <div style={{ marginTop: 2, font: '400 13px -apple-system, sans-serif', color: 'var(--fg-muted)' }}>
                    {n.message}
                  </div>
                  <div style={{ marginTop: 4, font: '400 11px monospace', color: 'var(--fg-subtle)' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                    background: 'var(--k-blue-500, #2a6cf0)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
