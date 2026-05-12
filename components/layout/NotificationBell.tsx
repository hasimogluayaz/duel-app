'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'
import { timeAgo } from '@/lib/utils/formatting'
import Link from 'next/link'

function getNotificationUrl(n: Notification): string | null {
  const data = (n as any).data ?? {}
  switch (n.type) {
    case 'duel_invite':
    case 'duel_result':
    case 'duel_accepted':
      if (data.share_token) return `/duel/${data.share_token}`
      if (data.duel_id) return `/duel/${data.duel_id}`
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
      return '/oyun'
    case 'achievement':
      return '/basarimlar'
    case 'weekly_mission_complete':
      return '/oyun'
    default:
      return null
  }
}

interface NotificationBellProps {
  userId: string
  size?: number
}

export function NotificationBell({ userId, size = 18 }: NotificationBellProps) {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    loadNotifications()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => {
            loadNotifications()
          }
        )
        .subscribe()
    } catch (e) {
      console.error('[NotificationBell] Realtime subscription failed:', e)
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }, [userId])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications(data ?? [])
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleNotificationClick(n: Notification) {
    // Mark as read
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }

    const url = getNotificationUrl(n)
    if (url) {
      setOpen(false)
      router.push(url)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface transition-colors"
        aria-label="Bildirimler"
      >
        <Bell size={size} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-fg text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-stroke rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stroke">
              <h3 className="font-bold text-fg">Bildirimler</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary/70 hover:text-primary/40"
                >
                  Tümünü oku
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-fg-subtle py-8 text-sm">Bildirim yok</p>
              ) : (
                notifications.map(n => {
                  const url = getNotificationUrl(n)
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      role={url ? 'button' : undefined}
                      tabIndex={url ? 0 : undefined}
                      onKeyDown={url ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n) } } : undefined}
                      className={`px-4 py-3 border-b border-stroke last:border-0 transition-colors ${
                        !n.is_read ? 'bg-primary/5' : ''
                      } ${url ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
                        )}
                        <div className={!n.is_read ? '' : 'pl-3.5'}>
                          <p className="text-sm text-fg font-medium">{n.title}</p>
                          <p className="text-xs text-fg-muted mt-0.5">{n.message}</p>
                          <p className="text-xs text-fg-subtle mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-3 border-t border-stroke">
              <Link
                href="/bildirimler"
                onClick={() => setOpen(false)}
                className="block text-center text-sm text-primary/70 hover:text-primary/40"
              >
                Tüm bildirimleri gör
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
