'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Home, Compass, User,
  MessageCircle, Bookmark, Trophy, BookOpen, Settings, ChevronRight, Bell, Medal, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  userId?: string | null
  username?: string | null
  isAdmin?: boolean
}

// ──────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────
export function BottomNav({ userId, username, isAdmin }: Props) {
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

  const isActive = (paths: string[]) => paths.some(p =>
    p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')
  )

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stroke max-w-full"
        style={{
          height: 68,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'color-mix(in oklab, var(--surface) 96%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-around h-full px-1">
          <TabItem
            icon={<Home size={21} />}
            label="Anasayfa"
            active={isActive(['/', '/duel', '/emoji', '/karakter', '/tartisma'])}
            href="/"
          />
          <TabItem
            icon={<Compass size={21} />}
            label="Keşfet"
            active={isActive(['/kesfet'])}
            href="/kesfet"
          />
          <TabItem
            icon={<Trophy size={21} />}
            label="Liderlik"
            active={isActive(['/liderlik'])}
            href="/liderlik"
          />

          {/* Profil — opens bottom sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] relative h-full"
            style={{
              color: isActive(['/profil', '/basarimlar', '/kayitlarim', '/mesajlar', '/arsiv', '/bildirimler', '/profil/ayarlar'])
                ? 'var(--k-blue-600)'
                : 'var(--fg-subtle)',
            }}
          >
            <span style={{
              position: 'relative',
              padding: isActive(['/profil', '/basarimlar', '/kayitlarim', '/mesajlar', '/arsiv', '/bildirimler', '/profil/ayarlar'])
                ? '4px 14px' : '4px 8px',
              background: isActive(['/profil', '/basarimlar', '/kayitlarim', '/mesajlar', '/arsiv', '/bildirimler', '/profil/ayarlar'])
                ? 'var(--k-blue-50)' : 'transparent',
              borderRadius: 999,
              transition: 'background .12s, padding .12s',
            }}>
              <User size={21} />
              {(unreadMsg + unreadNotif) > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[14px] h-[14px] px-[3px] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-surface"
                  style={{ background: 'var(--k3-warm-500, #ed6f1c)' }}>
                  {unreadMsg + unreadNotif > 9 ? '9+' : unreadMsg + unreadNotif}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: isActive(['/profil', '/basarimlar', '/kayitlarim', '/mesajlar', '/arsiv', '/bildirimler', '/profil/ayarlar']) ? 700 : 500, letterSpacing: isActive(['/profil', '/basarimlar', '/kayitlarim', '/mesajlar', '/arsiv', '/bildirimler', '/profil/ayarlar']) ? '-0.005em' : 0 }}>
              Profil
            </span>
          </button>
        </div>
      </nav>

      {/* "Daha" bottom sheet */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50"
            style={{ background: 'rgba(10,15,30,0.5)' }}
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-surface"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 22px)',
              animation: 'slideUp .25s ease-out',
            }}
          >
            {/* Drag handle */}
            <div
              className="mx-auto rounded-full"
              style={{ width: 40, height: 4, background: 'var(--stroke-strong)', margin: '10px auto 14px' }}
            />
            <div className="px-5 pb-3" style={{ font: '700 20px Geist, sans-serif', letterSpacing: '-0.02em' }}>
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
            {isAdmin && (
              <MoreItem
                icon={<Shield size={18} />}
                label="Admin Paneli"
                hint="Senaryo ve kullanıcı yönetimi"
                color="var(--primary)"
                onClick={() => { setMoreOpen(false); router.push('/admin') }}
              />
            )}
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
      className="flex-1 flex flex-col items-center justify-center gap-[3px] relative h-full"
      style={{ color: active ? 'var(--k-blue-600)' : 'var(--fg-subtle)' }}
    >
      <span style={{
        position: 'relative',
        padding: active ? '4px 14px' : '4px 8px',
        background: active ? 'var(--k-blue-50)' : 'transparent',
        borderRadius: 999,
        transition: 'background .12s, padding .12s',
      }}>
        {icon}
        {badge && badge > 0 ? (
          <span
            className="absolute -top-0.5 -right-1 min-w-[14px] h-[14px] px-[3px] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-surface"
            style={{ background: 'var(--k3-warm-500, #ed6f1c)' }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: active ? '-0.005em' : 0 }}>
        {label}
      </span>
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
        <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--k3-warm-500, #ed6f1c)' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
      <ChevronRight size={16} className="text-fg-subtle shrink-0" />
    </button>
  )
}
