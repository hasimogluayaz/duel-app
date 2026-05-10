'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  Home, Compass, Swords, Bell, User, Settings,
  BookOpen, Trophy, Plus, LogOut, MessageCircle, Bookmark,
} from 'lucide-react'

interface Props {
  profile: Profile
}

const NAV = [
  { href: '/oyun',        label: 'Anasayfa',    icon: Home },
  { href: '/kesfet',      label: 'Keşfet',      icon: Compass },
  { href: '/arsiv',       label: 'Arşiv',        icon: BookOpen },
  { href: '/bildirimler', label: 'Bildirimler',  icon: Bell },
  { href: '/mesajlar',    label: 'Mesajlar',     icon: MessageCircle },
  { href: '/liderlik',    label: 'Liderlik',     icon: Trophy },
  { href: '/kayitlarim',  label: 'Kaydettiklerim', icon: Bookmark },
]

export function LeftSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)
  const tier = getTier(profile.total_points)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 border-r border-stroke bg-surface z-30 overflow-y-auto">
      <div className="flex flex-col h-full px-3 py-4">

        {/* Logo */}
        <Link href="/oyun" className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-surface-2 transition-colors mb-2 group">
          <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-black text-xl text-gradient">Kapisio</span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 mt-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-2xl text-[15px] font-medium transition-colors',
                  active
                    ? 'text-fg font-bold'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={active ? 'text-primary' : ''} />
                <span>{label}</span>
              </Link>
            )
          })}

          <Link
            href={`/profil/${profile.username}`}
            className={cn(
              'flex items-center gap-4 px-3 py-3 rounded-2xl text-[15px] font-medium transition-colors',
              pathname.startsWith('/profil')
                ? 'text-fg font-bold'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            )}
          >
            <User size={22} strokeWidth={pathname.startsWith('/profil') ? 2.5 : 1.8} className={pathname.startsWith('/profil') ? 'text-primary' : ''} />
            <span>Profil</span>
          </Link>

          <Link
            href="/profil/ayarlar"
            className="flex items-center gap-4 px-3 py-3 rounded-2xl text-[15px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <Settings size={22} strokeWidth={1.8} />
            <span>Ayarlar</span>
          </Link>
        </nav>

        {/* Create button */}
        <Link
          href="/senaryo-olustur"
          className="mt-4 mx-1 flex items-center justify-center gap-2 btn-gradient rounded-full py-3.5 text-[15px] font-bold text-white transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          Senaryo Oluştur
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User profile card at bottom */}
        <div className="mt-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-2 transition-colors group">
            <div className={`p-0.5 rounded-full ring-2 ${tier.ringColor} shrink-0`}>
              <Avatar src={profile.avatar_url} username={profile.username} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-fg truncate leading-tight">
                {profile.display_name || profile.username}
              </p>
              <p className="text-xs text-fg-subtle truncate">@{profile.username}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-fg-subtle hover:text-red-400 transition-all"
              title="Çıkış Yap"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </div>
    </aside>
  )
}
