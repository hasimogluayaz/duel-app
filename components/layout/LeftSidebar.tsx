'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  Home, Compass, Bell, MessageCircle, Trophy, BookOpen,
  Bookmark, User, Settings, Plus, Flame, MoreHorizontal, LogOut,
} from 'lucide-react'

interface Props {
  profile: Profile
}

export function LeftSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NAV = [
    { href: '/oyun',        label: 'Anasayfa',       icon: Home,           match: ['/oyun', '/duel', '/emoji', '/karakter', '/tartisma'] },
    { href: '/kesfet',      label: 'Keşfet',         icon: Compass,        match: ['/kesfet'] },
    { href: '/bildirimler', label: 'Bildirimler',    icon: Bell,           match: ['/bildirimler'] },
    { href: '/mesajlar',    label: 'Mesajlar',       icon: MessageCircle,  match: ['/mesajlar'] },
    { href: '/liderlik',    label: 'Liderlik',       icon: Trophy,         match: ['/liderlik'] },
    { href: '/arsiv',       label: 'Arşiv',          icon: BookOpen,       match: ['/arsiv'] },
    { href: '/kayitlarim',  label: 'Kaydettiklerim', icon: Bookmark,       match: ['/kayitlarim'] },
    { href: `/profil/${profile.username}`, label: 'Profil', icon: User,    match: ['/profil/' + profile.username, '/basarimlar'] },
    { href: '/profil/ayarlar', label: 'Ayarlar',     icon: Settings,       match: ['/profil/ayarlar'] },
  ]

  const isActive = (matches: string[]) => matches.some(m => pathname === m || pathname.startsWith(m + '/'))

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 border-r border-stroke z-30 overflow-y-auto"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex flex-col h-full px-3.5 py-4 gap-1">

        {/* Logo */}
        <Link href="/oyun" className="flex items-center gap-2 px-2 py-1.5 mb-3 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Kapisio</span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(match)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl text-[14.5px] transition-colors relative"
                style={{
                  padding: '10px 12px',
                  background: active ? 'var(--k-blue-50)' : 'transparent',
                  color: active ? 'var(--k-blue-700)' : 'var(--fg)',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: active ? '-0.005em' : '0',
                }}
              >
                {/* Left accent bar for active */}
                {active && (
                  <span style={{
                    position: 'absolute', left: -14, top: 8, bottom: 8,
                    width: 3, background: 'var(--k-blue-500)',
                    borderRadius: '0 4px 4px 0',
                  }} />
                )}
                <Icon
                  size={19}
                  strokeWidth={active ? 2 : 1.75}
                  style={{ color: active ? 'var(--k-blue-600)' : 'var(--fg-muted)', flexShrink: 0 }}
                />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Senaryo Oluştur — primary button */}
        <Link
          href="/senaryo-olustur"
          className="mt-4 flex items-center justify-center gap-2 text-white font-bold text-[14px] transition-all hover:opacity-90"
          style={{
            height: 46, borderRadius: 12, letterSpacing: '-0.005em',
            background: 'var(--k-blue-500)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 6px 16px -4px rgba(42,108,240,0.45)',
          }}
        >
          <Plus size={18} strokeWidth={2.2} />
          Senaryo Oluştur
        </Link>

        {/* Spacer pushes streak + user chip to bottom */}
        <div className="flex-1" />

        {/* Streak card — v3 warm gradient */}
        {(profile.streak_count ?? 0) > 0 && (
          <div
            className="p-3.5 rounded-[14px] text-white mb-3"
            style={{
              background: 'linear-gradient(140deg, var(--k3-warm-500, #ed6f1c), var(--k3-warm-600, #c8540e))',
              boxShadow: '0 8px 20px -8px rgba(237,111,28,0.4)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <Flame size={22} />
              <div className="flex-1 min-w-0">
                <div className="font-black text-[16px]" style={{ letterSpacing: '-0.01em' }}>
                  <span className="tab-nums">{profile.streak_count}</span> günlük seri
                </div>
                <div className="text-[11.5px] opacity-85 mt-0.5">
                  Bugünü cevapla, seri kopmasın.
                </div>
              </div>
            </div>
            {/* 7-day progress dots */}
            <div className="flex gap-1">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} style={{
                  flex: 1, height: 4, borderRadius: 99,
                  background: i < Math.min(profile.streak_count ?? 0, 7) ? '#fff' : 'rgba(255,255,255,0.25)',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* User chip — opens mini menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-[10px] border border-stroke hover:bg-surface-2 transition-colors text-left"
          >
            <Avatar src={profile.avatar_url} username={profile.username} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold truncate">{profile.display_name || profile.username}</div>
              <div className="text-[11.5px] text-fg-subtle truncate" style={{ fontFamily: 'var(--k-font-mono, monospace)' }}>@{profile.username}</div>
            </div>
            <MoreHorizontal size={16} className="text-fg-subtle shrink-0" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-stroke rounded-xl shadow-lg overflow-hidden z-20">
                <Link
                  href={`/profil/${profile.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors"
                >
                  <User size={15} /> Profil
                </Link>
                <Link
                  href="/profil/ayarlar"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors"
                >
                  <Settings size={15} /> Ayarlar
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors border-t border-stroke"
                >
                  <LogOut size={15} /> Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </aside>
  )
}
