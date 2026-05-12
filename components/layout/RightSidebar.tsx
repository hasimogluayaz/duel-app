'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import TrendingTags from '@/components/social/TrendingTags'
import FollowSuggestions from '@/components/social/FollowSuggestions'
import MiniLeaderboard from '@/components/social/MiniLeaderboard'
import { Flame, Trophy } from 'lucide-react'

// Pages where the right sidebar shouldn't appear
const HIDE_ON = ['/giris', '/kayit', '/admin', '/profil/ayarlar', '/senaryo-olustur', '/arsiv']

export function RightSidebar() {
  const pathname = usePathname()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  return (
    <aside
      className="hidden xl:flex flex-col fixed top-0 right-0 h-screen w-80 border-l border-stroke z-20 overflow-y-auto scrollbar-none"
      style={{ background: 'var(--surface)' }}
    >
      {/* Push content below the top bar height */}
      <div style={{ height: 56, flexShrink: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '16px 18px 32px' }}>

        {/* ── Gündemdekiler (trending hashtags) ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow">Gündemdekiler</span>
            <Flame size={12} style={{ color: 'var(--k3-warm-500, #ed6f1c)' }} />
          </div>
          <TrendingTags />
        </section>

        {/* ── Bu hafta · liderler ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={11} style={{ color: 'var(--k3-warm-500, #ed6f1c)' }} />
              <span className="k3-eyebrow">Bu hafta · liderler</span>
            </div>
            <Link href="/liderlik" style={{
              background: 'none', border: 'none', color: 'var(--k-blue-600)',
              font: '600 11.5px Geist, sans-serif', cursor: 'pointer', textDecoration: 'none',
            }}>
              Tümü →
            </Link>
          </div>
          <MiniLeaderboard />
        </section>

        {/* ── Tanıyor Olabilirsin ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow">Tanıyor Olabilirsin</span>
          </div>
          <FollowSuggestions />
        </section>

      </div>
    </aside>
  )
}
