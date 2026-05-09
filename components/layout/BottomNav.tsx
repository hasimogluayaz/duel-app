'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Swords, Compass, BookOpen, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  userId?: string | null
  username?: string | null
}

export function BottomNav({ userId, username }: Props) {
  const pathname = usePathname()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    // Load initial unread count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then((res: { count: number | null }) => setUnreadCount(res.count ?? 0))

    // Realtime updates
    const channel = supabase
      .channel(`bottom-nav-notif:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => setUnreadCount(c => c + 1)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          // Re-fetch to stay accurate on bulk mark-as-read
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .then((res: { count: number | null }) => setUnreadCount(res.count ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const tabs = [
    {
      href: '/oyun',
      label: 'Oyna',
      icon: Swords,
      match: (p: string) => p.startsWith('/oyun') || p.startsWith('/duel'),
    },
    {
      href: '/kesfet',
      label: 'Keşfet',
      icon: Compass,
      match: (p: string) => p.startsWith('/kesfet'),
    },
    {
      href: '/arsiv',
      label: 'Arşiv',
      icon: BookOpen,
      match: (p: string) => p.startsWith('/arsiv'),
    },
    {
      href: '/bildirimler',
      label: 'Bildirimler',
      icon: Bell,
      match: (p: string) => p.startsWith('/bildirimler'),
      badge: unreadCount,
    },
    {
      href: username ? `/profil/${username}` : '/giris',
      label: 'Profil',
      icon: User,
      match: (p: string) => p.startsWith('/profil') || p.startsWith('/basarimlar') || p.startsWith('/kayitlarim'),
    },
  ]

  // Hide bottom nav on auth pages and admin
  const hideOn = ['/giris', '/kayit', '/sifre-sifirla', '/admin']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-stroke safe-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative',
                active ? 'text-purple-400' : 'text-fg-subtle hover:text-fg-muted'
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-purple-400' : '')}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
