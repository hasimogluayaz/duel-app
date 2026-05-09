'use client'

import { useState } from 'react'
import { Flame, Snowflake } from 'lucide-react'

interface Props {
  streak: number
  freezeCount: number
  userId: string
}

const MILESTONES = [3, 7, 14, 30, 60, 100]

export default function StreakWidget({ streak, freezeCount, userId }: Props) {
  const [freeze] = useState(freezeCount)

  const nextMilestone = MILESTONES.find(m => m > streak) ?? MILESTONES[MILESTONES.length - 1]
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= streak) ?? 0
  const progress = prevMilestone === nextMilestone
    ? 100
    : Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)

  const milestoneReward: Record<number, string> = {
    3: '+15 puan',
    7: '+100 puan',
    14: '+250 puan',
    30: '+500 puan',
    60: '+1000 puan',
    100: '+2500 puan',
  }

  return (
    <div className="rounded-2xl bg-surface border border-orange-500/15 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-fg">Günlük Seri</span>
        </div>
        {freeze > 0 && (
          <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2.5 py-1 text-xs text-cyan-400">
            <Snowflake size={10} />
            <span>{freeze} dondurma</span>
          </div>
        )}
      </div>

      {/* Streak number */}
      <div className="px-4 pb-3 flex items-end gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`font-black leading-none text-5xl ${
            streak >= 30 ? 'text-orange-400' :
            streak >= 7  ? 'text-amber-400' :
            streak >= 3  ? 'text-yellow-400' :
                           'text-fg-subtle'
          }`}>{streak}</span>
          <span className="text-fg-subtle text-sm mb-1">gün</span>
        </div>
        <div className="flex-1 pb-1">
          <div className="flex justify-between text-xs text-fg-subtle mb-1">
            <span>{streak} / {nextMilestone}</span>
            <span>{milestoneReward[nextMilestone]}</span>
          </div>
          <div className="h-2 rounded-full bg-stroke overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone markers */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1">
          {MILESTONES.map(m => (
            <div
              key={m}
              className={`flex-1 text-center text-[10px] font-bold py-1 rounded-lg transition-all ${
                streak >= m
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-surface-2 text-fg-subtle border border-stroke'
              }`}
            >
              {m}🔥
            </div>
          ))}
        </div>
      </div>

      {/* Motivation message */}
      <div className="px-4 pb-4">
        <p className="text-xs text-fg-subtle text-center">
          {streak === 0
            ? '👋 Bugün oyna ve seriyi başlat!'
            : streak < 3
            ? `${3 - streak} gün daha → ilk ödül!`
            : streak < 7
            ? `${7 - streak} gün daha → 7 günlük rozet! 🏅`
            : streak < 30
            ? `Müthiş! ${30 - streak} gün daha → efsane rozet!`
            : '🔥 Efsane serinde devam et!'}
        </p>
      </div>
    </div>
  )
}
