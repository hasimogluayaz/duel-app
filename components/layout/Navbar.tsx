'use client'

import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types'
import { Sun, Moon, Swords, User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'
import { DuelloDrawer } from '@/components/home/DuelloDrawer'

export function Navbar({ initialProfile }: { initialProfile?: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null)
  const [mounted, setMounted] = useState(false)
  const [duelloOpen, setDuelloOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <DuelloDrawer open={duelloOpen} onClose={() => setDuelloOpen(false)} userId={null} />

      <nav className="sticky top-0 z-40 border-b border-stroke bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Left: logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <Image src="/logo.png" alt="Kapisio" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-xl text-gradient hidden sm:inline">Kapisio</span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            <Link href="/nasil-oynanir" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-fg-muted">Nasıl Oynanır?</Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuelloOpen(true)}
              className="hidden sm:inline-flex gap-1.5"
            >
              <Swords size={14} />
              Düello
            </Button>

            {/* Mobile: Düello icon only */}
            <button
              onClick={() => setDuelloOpen(true)}
              className="sm:hidden p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              aria-label="Düello"
            >
              <Swords size={18} />
            </button>

            {profile ? (
              /* ── Logged-in: avatar + dropdown ── */
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-2 transition-colors"
                >
                  <Avatar
                    src={profile.avatar_url}
                    username={profile.display_name || profile.username}
                    size="sm"
                  />
                  <ChevronDown size={14} className={cn('text-fg-muted transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-stroke shadow-lg overflow-hidden"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Link
                      href={`/profil/${profile.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-surface-2 transition-colors"
                    >
                      <User size={15} className="text-fg-muted" />
                      Profilim
                    </Link>
                    <Link
                      href="/profil/ayarlar"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-surface-2 transition-colors"
                    >
                      <Settings size={15} className="text-fg-muted" />
                      Ayarlar
                    </Link>
                    {profile.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-2 transition-colors"
                        style={{ color: 'var(--primary)' }}
                      >
                        <Shield size={15} />
                        Admin Paneli
                      </Link>
                    )}
                    <div className="h-px bg-stroke mx-3" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-surface-2 transition-colors"
                    >
                      <LogOut size={15} />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest: Giriş Yap ── */
              <Link href="/giris">
                <Button variant="ghost" size="sm">Giriş Yap</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
