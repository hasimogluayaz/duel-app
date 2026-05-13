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
import { X, User, Settings, LogOut, Sun, Moon, Flame, Shield,
  Search, Bookmark, Medal, Swords, Compass, BookOpen, Bell, Trophy, MessageCircle, Menu } from 'lucide-react'
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
          .then(({ data }: { data: Profile | null }) => setProfile(data))
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

  // ── LOGGED-IN: mobile slim top bar (design: logo + search + msg + bell) ──
  if (profile) {
    return (
      <>
        {/* Mobile top bar (lg:hidden) — design spec: 54px, logo left, 3 icons right */}
        <header
          className="lg:hidden sticky top-0 z-40 border-b border-stroke"
          style={{
            height: 54,
            background: 'color-mix(in oklab, var(--bg) 94%, transparent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2.5 px-3.5 h-full">
            {/* Logo + wordmark left */}
            <Link href="/oyun" className="shrink-0 flex items-center gap-2">
              <Image src="/logo.png" alt="Kapisio" width={26} height={26} className="w-[26px] h-[26px] object-contain" />
              <span className="font-black text-[17px] text-gradient" style={{ letterSpacing: '-0.03em' }}>Kapisio</span>
            </Link>

            {/* Right: theme + search + msg + bell */}
            <div className="ml-auto flex items-center gap-0.5">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-[38px] h-[38px] flex items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 transition-colors"
                  aria-label="Tema"
                >
                  {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                </button>
              )}
              <Link
                href="/ara"
                className="w-[38px] h-[38px] flex items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 transition-colors"
                aria-label="Ara"
              >
                <Search size={19} />
              </Link>
              <MessageBell userId={profile.id} size={19} />
              <NotificationBell userId={profile.id} size={19} />
            </div>
          </div>
        </header>

        {/* Mobile drawer removed — BottomNav "Daha" tab handles secondary menu */}

        {/* Desktop top bar: very minimal — just theme + notifications (behind left sidebar) */}
        <header className="hidden lg:flex fixed top-0 left-64 right-0 xl:right-80 z-20 border-b border-stroke bg-surface/85 backdrop-blur-md h-14 items-center justify-end px-4 gap-1">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <Link href="/ara" className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors">
            <Search size={18} />
          </Link>
          <MessageBell userId={profile.id} size={18} />
          <NotificationBell userId={profile.id} size={18} />
          {(profile as any).is_admin && (
            <Link href="/admin" className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors">
              <Shield size={18} />
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
          <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-black text-xl text-gradient hidden sm:inline">Kapisio</span>
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
