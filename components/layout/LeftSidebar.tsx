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
  Home, Compass, Bell, User, Settings,
  BookOpen, Trophy, Plus, LogOut, MessageCircle, Bookmark, Flame,
} from 'lucide-react'

interface Props {
  profile: Profile
}

const NAV = [
  { href: '/oyun',        label: 'Anasayfa',      icon: Home },
  { href: '/kesfet',      label: 'Keşfet',        icon: Compass },
  { href: '/bildirimler', label: 'Bildirimler',    icon: Bell },
  { href: '/mesajlar',    label: 'Mesajlar',       icon: MessageCircle },
  { href: '/liderlik',    label: 'Liderlik',       icon: Trophy },
  { href: '/arsiv',       label: 'Arşiv',          icon: BookOpen },
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
        <Link href="/oyun" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition-colors mb-3 group">
          <Image src="/logo.png" alt="Kapisio" width={30} height={30} className="w-7 h-7 object-contain" />
          <span className="font-black text-[19px] text-gradient tracking-tight">Kapisio</span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] font-medium transition-all',
                  active
                    ? 'bg-primary/8 text-[#1442a8] font-semibold'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={active ? 'text-primary' : ''}
                />
                <span>{label}</span>
              </Link>
            )
          })}

          <Link
            href={`/profil/${profile.username}`}
            className={cn(
              'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] font-medium transition-all',
              pathname.startsWith('/profil') && !pathname.startsWith('/profil/ayarlar')
                ? 'bg-primary/8 text-[#1442a8] font-semibold'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            )}
          >
            <User
              size={20}
              strokeWidth={pathname.startsWith('/profil') && !pathname.startsWith('/profil/ayarlar') ? 2.3 : 1.8}
              className={pathname.startsWith('/profil') && !pathname.startsWith('/profil/ayarlar') ? 'text-primary' : ''}
            />
            <span>Profil</span>
          </Link>

          <Link
            href="/profil/ayarlar"
            className={cn(
              'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] font-medium transition-all',
              pathname.startsWith('/profil/ayarlar')
                ? 'bg-primary/8 text-[#1442a8] font-semibold'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            )}
          >
            <Settings size={20} strokeWidth={pathname.startsWith('/profil/ayarlar') ? 2.3 : 1.8}
              className={pathname.startsWith('/profil/ayarlar') ? 'text-primary' : ''} />
            <span>Ayarlar</span>
          </Link>
        </nav>

        {/* Create button */}
        <Link
          href="/senaryo-olustur"
          className="mt-4 mx-1 flex items-center justify-center gap-2 btn-gradient rounded-full py-3 text-[14.5px] font-semibold text-white transition-all"
        >
          <Plus size={17} strokeWidth={2.5} />
          Senaryo Oluştur
        </Link>

        <div className="flex-1" />

        {/* Streak card */}
        {profile.streak_count > 0 && (
          <div className="mx-1 mb-3 px-3 py-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1c2f6e 0%, #2a6cf0 100%)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className="text-orange-300" />
              <span className="text-sm font-bold text-white">{profile.streak_count} günlük seri</span>
            </div>
            <p className="text-[11.5px] text-white/80 leading-tight">
              Bugünkü senaryoyu cevapla, serin korunsun.
            </p>
          </div>
        )}

        {/* User profile card at bottom */}
        <div className="mx-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition-colors group border border-stroke">
            <div className={`p-0.5 rounded-full ring-2 ${tier.ringColor} shrink-0`}>
              <Avatar src={profile.avatar_url} username={profile.username} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-fg truncate leading-tight">
                {profile.display_name || profile.username}
              </p>
              <p className="text-[11.5px] text-fg-subtle truncate">@{profile.username}</p>
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
