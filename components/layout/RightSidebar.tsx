'use client'

import { usePathname } from 'next/navigation'
import TrendingScenarios from '@/components/social/TrendingScenarios'
import FollowSuggestions from '@/components/social/FollowSuggestions'

// Pages where the right sidebar shouldn't appear
const HIDE_ON = ['/giris', '/kayit', '/admin', '/profil/ayarlar', '/senaryo-olustur', '/arsiv/']

export function RightSidebar() {
  const pathname = usePathname()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  return (
    <aside className="hidden xl:flex flex-col fixed top-0 right-0 h-screen w-80 border-l border-stroke bg-surface z-20 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Trending */}
        <TrendingScenarios />
        {/* Who to follow */}
        <FollowSuggestions />
      </div>
    </aside>
  )
}
