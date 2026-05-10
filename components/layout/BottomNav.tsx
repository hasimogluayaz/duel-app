'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Home, Compass, Plus, User, MoreHorizontal,
  MessageCircle, BookOpen, Bookmark, Trophy, Settings, Bell, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  userId?: string | null
  username?: string | null
}

// ──────────────────────────────────────────────────────
// "Daha" bottom sheet
// ──────────────────────────────────────────────────────
function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  const items = [
    { href: '/bildirimler', label: 'Bildirimler',    hint: 'Yeni bildirimler',        icon: Bell },
    { href: '/mesajlar',    label: 'Mesajlar',       hint: 'Özel mesajlar',            icon: MessageCircle },
    { href: '/arsiv',       label: 'Arşiv',          hint: 'Geçmiş senaryolar',        icon: BookOpen },
    { href: '/kayitlarim',  label: 'Kaydettiklerim', hint: 'Kaydettiğin içerikler',    icon: Bookmark },
    { href: '/liderlik',    label: 'Liderlik',       hint: 'En iyi oyuncular',         icon: Trophy },
    { href: '/profil/ayarlar', label: 'Ayarlar',     hint: 'Hesap ve tercihler',       icon: Settings },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative bg-surface border-t border-stroke rounded-t-[20px] pb-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-stroke-strong rounded-full mx-auto mt-3 mb-3" />
        <p className="px-5 pb-2 text-[11px] font-semibold text-fg-subtle uppercase tracking-widest">Menü</p>

        {items.map(({ href, label, hint, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-none">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-semibold text-fg">{label}</div>
              <div className="text-[12px] text-fg-subtle mt-0.5">{hint}</div>
            </div>
            <ChevronRight size={15} className="text-fg-subtle flex-none" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Bottom nav tab (non-FAB)
// ──────────────────────────────────────────────────────
function Tab({
  label, active, badge, children, onClick, href,
}: {
  label: string
  active: boolean
  badge?: number
  children: React.ReactNode
  onClick?: () => void
  href?: string
}) {
  const cls = cn(
    'flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors relative h-full',
    active ? 'text-primary' : 'text-fg-subtle'
  )
  const inner = (
    <>
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary rounded-full" />
      )}
      <div className="relative">
        {children}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-surface">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>{label}</span>
    </>
  )

  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>
  }
  return <button onClick={onClick} className={cls}>{inner}</button>
}

// ──────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────
export function BottomNav({ userId, username }: Props) {
  const pathname = usePathname()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then((res: { count: number | null }) => setUnreadCount(res.count ?? 0))

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

  const isMoreActive = [
    '/arsiv', '/mesajlar', '/kayitlarim', '/liderlik', '/bildirimler', '/profil/ayarlar', '/basarimlar',
  ].some(p => pathname.startsWith(p))

  const hideOn = ['/giris', '/kayit', '/sifre-sifirla', '/admin']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const isHome    = pathname.startsWith('/oyun') || pathname.startsWith('/duel')
  const isKesfet  = pathname.startsWith('/kesfet')
  const isProfil  = pathname.startsWith('/profil') && !pathname.startsWith('/profil/ayarlar')

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-stroke">
        <div className="flex items-stretch h-16 px-1">

          {/* Anasayfa */}
          <Tab label="Anasayfa" active={isHome} href="/oyun">
            <Home size={21} strokeWidth={isHome ? 2.4 : 1.8} />
          </Tab>

          {/* Keşfet */}
          <Tab label="Keşfet" active={isKesfet} href="/kesfet">
            <Compass size={21} strokeWidth={isKesfet ? 2.4 : 1.8} />
          </Tab>

          {/* FAB — center raised button */}
          <div className="flex-1 flex items-center justify-center">
            <Link
              href="/senaryo-olustur"
              aria-label="Senaryo oluştur"
              className="flex items-center justify-center rounded-2xl shadow-lg active:scale-95 transition-transform"
              style={{
                width: 52,
                height: 52,
                background: 'linear-gradient(135deg, #5188fa 0%, #2a6cf0 60%, #1442a8 100%)',
                boxShadow: '0 6px 18px rgba(42,108,240,0.38)',
                transform: 'translateY(-13px)',
              }}
            >
              <Plus size={24} className="text-white" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Profil */}
          <Tab label="Profil" active={isProfil} href={username ? `/profil/${username}` : '/giris'}>
            <User size={21} strokeWidth={isProfil ? 2.4 : 1.8} />
          </Tab>

          {/* Daha */}
          <Tab label="Daha" active={isMoreActive} badge={isMoreActive ? 0 : unreadCount} onClick={() => setMoreOpen(true)}>
            <MoreHorizontal size={21} strokeWidth={isMoreActive ? 2.4 : 1.8} />
          </Tab>

        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
