'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LayoutDashboard, Users, ShieldAlert, FileText, Mail, LogOut, Menu, X, ChevronRight, Flag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/raporlar', label: 'Raporlar', icon: Flag },
  { href: '/admin/icerik', label: 'İçerik', icon: ShieldAlert },
  { href: '/admin/senaryolar', label: 'Senaryolar', icon: FileText },
  { href: '/admin/mesajlar', label: 'İletişim', icon: Mail },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, username')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) { router.push('/'); return }
      setUsername(profile.username)
      setChecking(false)
    }
    check()
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const currentPage = NAV.find(n => n.href === pathname)

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">

      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-stroke bg-surface flex-col py-6 px-3 gap-1 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <p className="text-xs font-bold text-fg-subtle uppercase tracking-widest px-3 mb-3">
          Admin Paneli
        </p>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-stroke">
          <p className="text-xs text-fg-subtle px-3 mb-2">@{username}</p>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <LogOut size={14} />
            Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-stroke bg-surface sticky top-16 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-fg-subtle">Admin</span>
            {currentPage && (
              <>
                <ChevronRight size={14} className="text-fg-subtle" />
                <span className="font-semibold text-fg">{currentPage.label}</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Sidebar Overlay ────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-72 z-50 bg-surface border-r border-stroke flex flex-col py-6 px-3 gap-1 lg:hidden">
            <div className="flex items-center justify-between px-3 mb-4">
              <p className="text-sm font-bold text-fg-subtle uppercase tracking-widest">
                Admin Paneli
              </p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
            <div className="mt-auto pt-4 border-t border-stroke">
              <p className="text-xs text-fg-subtle px-4 mb-2">@{username}</p>
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              >
                <LogOut size={16} />
                Siteye Dön
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
