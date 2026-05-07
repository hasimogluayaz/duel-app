import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, ShieldAlert, FileText, Mail, LogOut } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/icerik', label: 'İçerik', icon: ShieldAlert },
  { href: '/admin/senaryolar', label: 'Senaryolar', icon: FileText },
  { href: '/admin/mesajlar', label: 'İletişim', icon: Mail },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, username')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/oyun')

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-stroke bg-surface flex flex-col py-6 px-3 gap-1 sticky top-16 h-[calc(100vh-4rem)]">
        <p className="text-xs font-bold text-fg-subtle uppercase tracking-widest px-3 mb-3">
          Admin Paneli
        </p>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-stroke">
          <p className="text-xs text-fg-subtle px-3 mb-2">@{profile.username}</p>
          <Link
            href="/oyun"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <LogOut size={14} />
            Siteye Dön
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
