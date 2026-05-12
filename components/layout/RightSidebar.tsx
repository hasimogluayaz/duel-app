'use client'

import { usePathname } from 'next/navigation'
import TrendingScenarios from '@/components/social/TrendingScenarios'
import FollowSuggestions from '@/components/social/FollowSuggestions'

// Pages where the right sidebar shouldn't appear
const HIDE_ON = ['/giris', '/kayit', '/admin', '/profil/ayarlar', '/senaryo-olustur', '/arsiv']

export function RightSidebar() {
  const pathname = usePathname()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  return (
    <aside className="hidden xl:flex flex-col fixed top-0 right-0 h-screen w-80 border-l border-stroke z-20 overflow-y-auto"
      style={{ background: 'var(--surface)' }}>
      {/* Push content below the top bar height */}
      <div style={{ height: 56, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 16px 24px' }}>

        {/* Trending section */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2px 10px',
          }}>
            <span style={{
              font: '600 11px -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '.08em', color: 'var(--fg-subtle)',
              textTransform: 'uppercase',
            }}>Gündemdekiler</span>
          </div>
          <TrendingScenarios />
        </div>

        {/* Follow suggestions section */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2px 10px',
          }}>
            <span style={{
              font: '600 11px -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '.08em', color: 'var(--fg-subtle)',
              textTransform: 'uppercase',
            }}>Tanıyor Olabilirsin</span>
          </div>
          <FollowSuggestions />
        </div>

      </div>
    </aside>
  )
}
