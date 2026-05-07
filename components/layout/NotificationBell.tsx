'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'
import { timeAgo } from '@/lib/utils/formatting'
import Link from 'next/link'

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface transition-colors"
        aria-label="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-purple-500 text-fg text-[10px] font-bold rounded-full flex items-center justify-center">
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
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Tümünü oku
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-fg-subtle py-8 text-sm">Bildirim yok</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-stroke last:border-0 ${!n.is_read ? 'bg-purple-500/5' : ''}`}
                  >
                    <p className="text-sm text-fg font-medium">{n.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-fg-subtle mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-stroke">
              <Link
                href="/bildirimler"
                onClick={() => setOpen(false)}
                className="block text-center text-sm text-purple-400 hover:text-purple-300"
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
