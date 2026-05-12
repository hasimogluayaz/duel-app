'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Home, Compass, User, MoreHorizontal, Plus,
  MessageCircle, Bookmark, Trophy, BookOpen, Settings, ChevronRight, Bell, Medal,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  userId?: string | null
  username?: string | null
}

// ──────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────
export function BottomNav({ userId, username }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [unreadMsg, setUnreadMsg] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    // notifications
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then((res: { count: number | null }) => setUnreadNotif(res.count ?? 0))

    // messages
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnreadMsg(d.count ?? 0))
      .catch(() => {})

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`bottom-nav:${userId}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => setUnreadNotif(c => c + 1)
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => {
            supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_read', false)
              .then((res: { count: number | null }) => setUnreadNotif(res.count ?? 0))
          }
        )
        .subscribe()
    } catch (e) {
      console.error('[BottomNav] Realtime subscription failed:', e)
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }, [userId])

  // Hide on auth pages and admin
  const hideOn = ['/giris', '/kayit', '/sifre-sifirla', '/admin']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const isActive = (paths: string[]) => paths.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-stroke max-w-full"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 12px rgba(15,19,32,0.04)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          <TabItem
            icon={<Home size={22} />}
            label="Anasayfa"
            active={isActive(['/oyun', '/duel', '/emoji', '/karakter', '/tartisma'])}
            href="/oyun"
          />
          <TabItem
            icon={<Compass size={22} />}
            label="Keşfet"
            active={isActive(['/kesfet'])}
            href="/kesfet"
          />

          {/* Center FAB */}
          <Link
            href="/senaryo-olustur"
            aria-label="Senaryo oluştur"
            className="flex items-center justify-center text-white -translate-y-3"
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--k-blue-400), var(--k-blue-600))',
              boxShadow: '0 6px 16px rgba(42,108,240,0.35)',
            }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </Link>

          <TabItem
            icon={<User size={22} />}
            label="Profil"
            active={isActive(['/profil', '/basarimlar', '/kayitlarim'])}
            href={username ? `/profil/${username}` : '/giris'}
          />

          {/* More — opens bottom sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
              isActive(['/mesajlar', '/arsiv', '/liderlik', '/bildirimler', '/profil/ayarlar'])
                ? 'text-primary'
                : 'text-fg-subtle'
            )}
          >
            <span className="relative">
              <MoreHorizontal size={22} />
              {(unreadMsg + unreadNotif) > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-surface">
                  {unreadMsg + unreadNotif > 9 ? '9+' : unreadMsg + unreadNotif}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">Daha</span>
          </button>
        </div>
      </nav>

      {/* "Daha" bottom sheet */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/45"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-surface border-t border-stroke pb-4"
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              animation: 'slideUp .22s ease-out',
            }}
          >
            {/* Drag handle */}
            <div
              className="mx-auto my-2 bg-stroke rounded-full"
              style={{ width: 38, height: 4 }}
            />
            <div className="px-5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
              Menü
            </div>

            <MoreItem
              icon={<MessageCircle size={18} />}
              label="Mesajlar"
              hint={unreadMsg > 0 ? `${unreadMsg} yeni mesaj` : 'Konuşmaların'}
              color="var(--k-blue-500)"
              badge={unreadMsg > 0 ? unreadMsg : undefined}
              onClick={() => { setMoreOpen(false); router.push('/mesajlar') }}
            />
            <MoreItem
              icon={<Bell size={18} />}
              label="Bildirimler"
              hint={unreadNotif > 0 ? `${unreadNotif} yeni bildirim` : 'Son güncellemeler'}
              color="var(--k-sky-500)"
              badge={unreadNotif > 0 ? unreadNotif : undefined}
              onClick={() => { setMoreOpen(false); router.push('/bildirimler') }}
            />
            <MoreItem
              icon={<BookOpen size={18} />}
              label="Arşiv"
              hint="Geçmiş senaryolar"
              color="var(--fg-muted)"
              onClick={() => { setMoreOpen(false); router.push('/arsiv') }}
            />
            <MoreItem
              icon={<Bookmark size={18} />}
              label="Kaydettiklerim"
              hint="Beğendiklerin"
              color="var(--k-navy-500)"
              onClick={() => { setMoreOpen(false); router.push('/kayitlarim') }}
            />
            <MoreItem
              icon={<Trophy size={18} />}
              label="Liderlik"
              hint="Bu hafta sıralaması"
              color="var(--k-sky-500)"
              onClick={() => { setMoreOpen(false); router.push('/liderlik') }}
            />
            <MoreItem
              icon={<Medal size={18} />}
              label="Başarımlar"
              hint="Rozetlerin"
              color="var(--k-blue-700)"
              onClick={() => { setMoreOpen(false); router.push('/basarimlar') }}
            />
            <MoreItem
              icon={<Settings size={18} />}
              label="Ayarlar"
              hint="Tema · bildirim · gizlilik"
              color="var(--fg-muted)"
              onClick={() => { setMoreOpen(false); router.push('/profil/ayarlar') }}
            />
          </div>
        </>
      )}
    </>
  )
}

function TabItem({
  icon, label, active, href, badge,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  href: string
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 relative h-full',
        active ? 'text-primary' : 'text-fg-subtle'
      )}
    >
      <span className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-surface">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>{label}</span>
    </Link>
  )
}

function MoreItem({
  icon, label, hint, color, badge, onClick,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  color: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left px-5 py-3 hover:bg-surface-2 transition-colors"
    >
      <span
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in oklab, ${color} 12%, white)`,
          color: color,
        }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-semibold text-fg truncate">{label}</span>
        <span className="block text-xs text-fg-subtle mt-0.5 truncate">{hint}</span>
      </span>
      {badge ? (
        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
      <ChevronRight size={16} className="text-fg-subtle shrink-0" />
    </button>
  )
}
