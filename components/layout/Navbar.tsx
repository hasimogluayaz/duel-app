'use client'

import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from './NotificationBell'
import { formatPoints } from '@/lib/utils/formatting'
import type { Profile } from '@/types'
import { Swords, Menu, X, Trophy, User, Settings, LogOut, Sun, Moon, Star, Flame, MessageCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

export function Navbar({ initialProfile }: { initialProfile?: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/oyun', label: 'Oyna', icon: <Swords size={15} /> },
    { href: '/liderlik', label: 'Liderlik', icon: <Trophy size={15} /> },
    { href: '/kesfet', label: 'Keşfet', icon: <Search size={15} /> },
    { href: '/nasil-oynanir', label: 'Nasıl Oynanır', icon: null },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-stroke bg-surface/80 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-black text-xl text-gradient">Kapisio</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-2'
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {profile ? (
            <>
              <NotificationBell userId={profile.id} />
              <MessageBell userId={profile.id} />
              <div className="hidden md:flex items-center gap-2">
                <UserMenu profile={profile} onSignOut={handleSignOut} />
              </div>
              <button
                className="md:hidden text-fg-muted hover:text-fg"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            <>
              <Link href="/giris" className="hidden md:block">
                <Button variant="ghost" size="sm">Giriş Yap</Button>
              </Link>
              <Link href="/kayit" className="hidden md:block">
                <Button size="sm" className="btn-gradient">Kayıt Ol</Button>
              </Link>
              <button
                className="md:hidden text-fg-muted hover:text-fg"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stroke bg-surface px-4 py-4 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                pathname === link.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-2'
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {profile && (
            <>
              <hr className="border-stroke my-1" />
              {/* Mobile user card */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-2 rounded-xl mb-1">
                <Avatar src={profile.avatar_url} username={profile.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{profile.display_name || profile.username}</p>
                  <p className="text-xs text-purple-400">⭐ {formatPoints(profile.total_points)} puan</p>
                </div>
                {profile.streak_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Flame size={12} />
                    {profile.streak_count}
                  </div>
                )}
              </div>
              <Link href={`/profil/${profile.username}`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg-muted hover:text-fg hover:bg-surface-2">
                <User size={16} /> Profilim
              </Link>
              <Link href="/mesajlar" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg-muted hover:text-fg hover:bg-surface-2">
                <MessageCircle size={16} /> Mesajlar
              </Link>
              <Link href="/profil/ayarlar" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg-muted hover:text-fg hover:bg-surface-2">
                <Settings size={16} /> Ayarlar
              </Link>
              {profile.is_admin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                  <Star size={16} /> Admin Paneli
                </Link>
              )}
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:text-red-400 hover:bg-surface-2 text-left transition-colors">
                <LogOut size={16} /> Çıkış Yap
              </button>
            </>
          )}
          {!profile && (
            <div className="flex gap-2 mt-1">
              <Link href="/giris" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">Giriş Yap</Button>
              </Link>
              <Link href="/kayit" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button className="w-full btn-gradient" size="sm">Kayıt Ol</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

function UserMenu({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors',
          open ? 'bg-surface-2' : 'hover:bg-surface-2'
        )}
      >
        <Avatar src={profile.avatar_url} username={profile.username} size="sm" />
        <div className="text-left">
          <p className="text-sm font-semibold text-fg leading-tight">
            {profile.display_name || profile.username}
          </p>
          <p className="text-xs text-purple-400 leading-tight flex items-center gap-1">
            <Star size={9} className="fill-amber-400 text-amber-400" />
            {formatPoints(profile.total_points)} puan
            {profile.streak_count > 0 && (
              <span className="text-amber-400 flex items-center gap-0.5 ml-1">
                · <Flame size={9} /> {profile.streak_count}
              </span>
            )}
          </p>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-stroke rounded-xl shadow-xl z-20 overflow-hidden">
            {/* User header in dropdown */}
            <div className="px-4 py-3 bg-surface-2 border-b border-stroke">
              <p className="text-xs text-fg-subtle">@{profile.username}</p>
              {profile.personality_type && (
                <p className="text-xs text-purple-400 mt-0.5">🧠 {profile.personality_type}</p>
              )}
            </div>
            <div className="py-1">
              <Link href={`/profil/${profile.username}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
                <User size={15} /> Profilim
              </Link>
              <Link href="/mesajlar" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
                <MessageCircle size={15} /> Mesajlar
              </Link>
              <Link href="/profil/ayarlar" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
                <Settings size={15} /> Ayarlar
              </Link>
              {profile.is_admin && (
                <>
                  <hr className="border-stroke my-1" />
                  <Link href="/admin" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors">
                    <Star size={15} /> Admin Paneli
                  </Link>
                </>
              )}
              <hr className="border-stroke my-1" />
              <button onClick={onSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                <LogOut size={15} /> Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MessageBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)
      setUnread(count ?? 0)
    }
    fetchUnread()

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        () => { setUnread(c => c + 1) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        () => { fetchUnread() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <Link href="/mesajlar" className="relative p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
      <MessageCircle size={18} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
