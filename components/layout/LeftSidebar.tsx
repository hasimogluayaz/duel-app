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
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(match)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[14.5px] transition-colors',
                  active
                    ? 'font-semibold'
                    : 'font-medium text-fg hover:bg-surface-2'
                )}
                style={active ? {
                  background: 'var(--k-blue-50)',
                  color: 'var(--k-blue-700)',
                } : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.75} style={{
                  color: active ? 'var(--k-blue-600)' : 'var(--fg-muted)',
                }} />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Senaryo Oluştur — primary button */}
        <Link
          href="/senaryo-olustur"
          className="mt-3 flex items-center justify-center gap-2 h-11 px-4 rounded-full text-white font-semibold text-[14.5px] transition-opacity hover:opacity-90"
          style={{ background: 'var(--k-blue-500)' }}
        >
          <Plus size={18} strokeWidth={2.2} />
          Senaryo Oluştur
        </Link>

        {/* Spacer pushes streak + user chip to bottom */}
        <div className="flex-1" />

        {/* Streak card */}
        {(profile.streak_count ?? 0) > 0 && (
          <div
            className="p-3 rounded-[10px] text-white mb-2"
            style={{
              background: 'linear-gradient(135deg, var(--k-blue-700), var(--k-navy-500))',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} />
              <span className="font-bold text-[14px]">{profile.streak_count} günlük seri</span>
            </div>
            <div className="text-xs opacity-90 leading-snug">
              Bugünkü senaryoyu cevapla, seri korunsun.
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
