'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { getTier } from '@/lib/utils/tier'
import { Trophy, Share2, ChevronRight } from 'lucide-react'

interface Champion {
  week_start: string
  vote_count: number
  scenario_content?: string
  user: { username: string; display_name: string; avatar_url: string | null; total_points?: number }
  answer: { content: string; vote_count: number; verdict_count: number; scenario_id: string }
}

export default function WeeklyChampionCard() {
  const [champion, setChampion] = useState<Champion | null>(null)
  const [loading, setLoading]   = useState(true)
  const [shared, setShared]     = useState(false)

  useEffect(() => {
    fetch('/api/weekly-champion')
      .then(r => r.json())
      .then(data => { setChampion(data.champion); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function share() {
    const text = champion
      ? `Bu haftanın Duel şampiyonu: @${champion.user.username}! 🏆\n"${champion.answer.content.slice(0, 120)}${champion.answer.content.length > 120 ? '...' : ''}"\n\nkapisio.com`
      : 'kapisio.com — Duel'
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (loading) return (
    <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 p-5 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-40 mb-3" />
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/5 rounded w-full" />
        </div>
      </div>
    </div>
  )

  if (!champion) return null

  const tier = getTier(champion.user?.total_points ?? 0)
  const totalVotes = (champion.answer?.vote_count ?? 0) + (champion.answer?.verdict_count ?? 0)

  const weekLabel = (() => {
    const d = new Date(champion.week_start)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' haftası'
  })()

  return (
    <div className="rounded-2xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-[#1a1a2e] to-[#1a1a2e]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Haftanın Şampiyonu</span>
          </div>
          <span className="text-[10px] text-white/30">{weekLabel}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar src={champion.user?.avatar_url} username={champion.user?.username} size="md" />
            <div className="absolute -bottom-1 -right-1 text-base leading-none">🏆</div>
          </div>
          <div className="min-w-0">
            <Link
              href={`/profil/${champion.user?.username}`}
              className="text-sm font-semibold text-white hover:text-violet-300 transition-colors"
            >
              {champion.user?.display_name || champion.user?.username}
            </Link>
            <p className="text-xs text-white/40">{tier.emoji} {tier.label}</p>
          </div>
          <div className="ml-auto text-right shrink-0">
            <p className="text-lg font-black text-yellow-400">{totalVotes}</p>
            <p className="text-[10px] text-white/30">toplam puan</p>
          </div>
        </div>

        {/* Scenario context */}
        {champion.scenario_content && (
          <p className="text-xs text-white/40 italic leading-relaxed">
            &ldquo;{champion.scenario_content}&rdquo;
          </p>
        )}

        {/* Answer */}
        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
          <p className="text-sm text-white/80 leading-relaxed line-clamp-4">
            {champion.answer?.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/arsiv/${champion.answer?.scenario_id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-xs text-white/60 hover:text-white transition-all"
          >
            Cevabı Gör <ChevronRight size={12} />
          </Link>
          <button
            onClick={share}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white transition-all"
          >
            <Share2 size={12} />
            {shared ? 'Kopyalandı!' : 'Paylaş'}
          </button>
        </div>
      </div>
    </div>
  )
}
