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
import { MessageBell } from './MessageBell'
import { formatPoints } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import type { Profile } from '@/types'
import { Menu, X, User, Settings, LogOut, Sun, Moon, Star, Flame, Shield,
  Search, Bookmark, Medal, Swords, Compass, BookOpen, Bell, Trophy } from 'lucide-react'
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data))
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

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null

  // ── LOGGED-IN: mobile-only slim top bar ──────────────────────────────────
  if (profile) {
    return (
      <>
        {/* Mobile top bar: logo + actions (lg:hidden) */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-stroke bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/oyun" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="font-black text-lg text-gradient">Kapisio</span>
            </Link>
            <div className="flex items-center gap-1">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              )}
              <MessageBell userId={profile.id} />
              <NotificationBell userId={profile.id} />
              <button
                className="p-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-xl transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile slide-down menu */}
          {mobileOpen && (
            <div className="border-t border-stroke bg-surface px-4 py-4 flex flex-col gap-1">
              {/* User card */}
              <div className="flex items-center gap-3 px-3 py-3 bg-surface-2 rounded-2xl mb-2">
                {(() => { const t = getTier(profile.total_points); return (
                  <div className={`p-0.5 rounded-full ring-2 ${t.ringColor}`}>
                    <Avatar src={profile.avatar_url} username={profile.username} size="md" />
                  </div>
                )})()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-fg truncate">{profile.display_name || profile.username}</p>
                  <p className="text-xs text-fg-subtle">@{profile.username}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-black text-fg">{formatPoints(profile.total_points)}</span>
                </div>
              </div>

              {[
                { href: '/oyun', label: 'Anasayfa', icon: Swords },
                { href: '/kesfet', label: 'Keşfet', icon: Compass },
                { href: '/arsiv', label: 'Arşiv', icon: BookOpen },
                { href: '/bildirimler', label: 'Bildirimler', icon: Bell },
                { href: '/liderlik', label: 'Liderlik', icon: Trophy },
                { href: `/profil/${profile.username}`, label: 'Profil', icon: User },
                { href: '/basarimlar', label: 'Başarımlar', icon: Medal },
                { href: '/kayitlarim', label: 'Kaydettiklerim', icon: Bookmark },
                { href: '/profil/ayarlar', label: 'Ayarlar', icon: Settings },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                    pathname === href ? 'bg-primary/10 text-primary font-semibold' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                  )}>
                  <Icon size={16} /> {label}
                </Link>
              ))}

              {(profile as any).is_admin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-primary hover:bg-primary/10 transition-colors">
                  <Shield size={16} /> Admin Panel
                </Link>
              )}
              <div className="h-px bg-stroke my-1" />
              {profile.streak_count > 0 && (
                <div className="flex items-center gap-2 px-4 py-1 text-xs text-amber-400">
                  <Flame size={13} /> {profile.streak_count} günlük seri
                </div>
              )}
              <button onClick={() => { handleSignOut(); setMobileOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-500 hover:bg-red-500/5 transition-colors">
                <LogOut size={16} /> Çıkış Yap
              </button>
            </div>
          )}
        </header>

        {/* Desktop top bar: very minimal — just theme + notifications (behind left sidebar) */}
        <header className="hidden lg:flex fixed top-0 left-64 right-0 xl:right-80 z-20 border-b border-stroke bg-surface/80 backdrop-blur-md h-14 items-center justify-end px-4 gap-1">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <Link href="/ara" className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
            <Search size={16} />
          </Link>
          <MessageBell userId={profile.id} />
          <NotificationBell userId={profile.id} />
          {(profile as any).is_admin && (
            <Link href="/admin" className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors">
              <Shield size={16} />
            </Link>
          )}
        </header>
      </>
    )
  }

  // ── GUEST: full top navbar ────────────────────────────────────────────────
  const navLinks = [
    { href: '/oyun', label: 'Oyna' },
    { href: '/kesfet', label: 'Keşfet' },
    { href: '/arsiv', label: 'Arşiv' },
    { href: '/liderlik', label: 'Liderlik' },
    { href: '/nasil-oynanir', label: 'Nasıl Oynanır' },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-stroke bg-surface/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
          <span className="font-black text-xl text-gradient">Kapisio</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                pathname === link.href ? 'text-fg font-semibold' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
              )}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          <Link href="/giris" className="hidden md:block">
            <Button variant="ghost" size="sm">Giriş Yap</Button>
          </Link>
          <Link href="/kayit" className="hidden md:block">
            <Button size="sm" className="btn-gradient">Kayıt Ol</Button>
          </Link>
          <button className="md:hidden p-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-xl transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-stroke bg-surface px-4 py-3 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-stroke my-2" />
          <div className="flex gap-2">
            <Link href="/giris" onClick={() => setMobileOpen(false)} className="flex-1">
              <Button variant="outline" className="w-full">Giriş Yap</Button>
            </Link>
            <Link href="/kayit" onClick={() => setMobileOpen(false)} className="flex-1">
              <Button className="w-full btn-gradient">Kayıt Ol</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
