'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Clock, TrendingUp, Crown } from 'lucide-react'
import { getTier } from '@/lib/utils/tier'

interface SeasonData {
  season: { id: string; name: string; starts_at: string; ends_at: string } | null
  top: Array<{
    rank: number
    username: string
    display_name: string | null
    avatar_url: string | null
    season_points: number
    active_title: string | null
    total_points: number
  }>
  my_rank: number | null
  days_left: number
}

export default function SeasonCard() {
  const [data, setData] = useState<SeasonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/seasons')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
  if (!data?.season) return null

  const RANK_MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-[#1a1a2e] border border-amber-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600/20 to-yellow-500/10 border-b border-amber-500/15 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-300">{data.season.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock size={11} />
            <span>{data.days_left} gün kaldı</span>
          </div>
        </div>
        {data.my_rank && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <TrendingUp size={11} className="text-amber-400/60" />
            <span className="text-xs text-amber-400/70">Sıran: <span className="font-black text-amber-300">#{data.my_rank}</span></span>
          </div>
        )}
      </div>

      {/* Top 3 */}
      <div className="p-3 space-y-2">
        {data.top.slice(0, 5).map((p, i) => {
          const tier = getTier(p.total_points)
          return (
            <Link key={p.username} href={`/profil/${p.username}`}>
              <div className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors hover:bg-white/5 ${i < 3 ? '' : 'opacity-70'}`}>
                <span className="text-base w-5 text-center shrink-0">
                  {i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
                </span>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <Image src={p.avatar_url} alt="" width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                      {(p.display_name ?? p.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate">{p.display_name ?? p.username}</span>
                    <span className="text-xs shrink-0">{tier.emoji}</span>
                  </div>
                  {p.active_title && (
                    <span className="text-[9px] text-white/35">{p.active_title}</span>
                  )}
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-amber-400">{p.season_points.toLocaleString('tr-TR')}</p>
                  <p className="text-[9px] text-white/30">puan</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-3 pb-3">
        <Link href="/liderlik">
          <button className="w-full text-xs text-amber-400/70 hover:text-amber-300 py-1.5 border border-amber-500/15 hover:border-amber-500/30 rounded-xl transition-all">
            Tüm sıralamaları gör →
          </button>
        </Link>
      </div>
    </div>
  )
}
