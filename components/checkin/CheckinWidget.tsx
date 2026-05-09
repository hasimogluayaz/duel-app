'use client'

import { useState, useEffect } from 'react'
import { Flame, Gift, CheckCircle2, Star } from 'lucide-react'

interface CheckinStatus {
  checked_in_today: boolean
  points_today: number
  streak: number
  next_milestone: number | null
  next_reward: number | null
  days_until_next: number | null
}

const MILESTONES = [3, 7, 14, 30, 60, 100]

export default function CheckinWidget() {
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [justClaimed, setJustClaimed] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)

  useEffect(() => {
    fetch('/api/checkin')
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const claim = async () => {
    if (claiming || status?.checked_in_today) return
    setClaiming(true)
    const res = await fetch('/api/checkin', { method: 'POST' })
    const d = await res.json()
    if (d.success) {
      setEarnedPoints(d.points_awarded)
      setJustClaimed(true)
      setStatus(prev => prev ? {
        ...prev,
        checked_in_today: true,
        points_today: d.points_awarded,
        streak: d.streak_day,
      } : prev)
    }
    setClaiming(false)
  }

  if (loading) return (
    <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
  )

  if (!status) return null

  const streak = status.streak
  const nextMilestone = status.next_milestone
  const progress = nextMilestone && streak > 0
    ? Math.round((streak / nextMilestone) * 100)
    : 0
  const prevMilestone = MILESTONES.filter(m => m <= streak).pop() ?? 0

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all ${
      status.checked_in_today
        ? 'bg-green-500/8 border-green-500/25'
        : 'bg-[#1a1a2e] border-white/10 hover:border-orange-500/30'
    }`}>
      {/* Burst animation */}
      {justClaimed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-5xl animate-bounce">🎉</div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className={streak >= 7 ? 'text-orange-400' : 'text-white/40'} />
            <span className="text-sm font-bold text-white">Günlük Giriş</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-orange-400">{streak}</span>
            <span className="text-xs text-white/40">gün serisi</span>
          </div>
        </div>

        {/* Milestone progress bar */}
        {nextMilestone && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
              <span>{prevMilestone}g</span>
              <span className="text-orange-400 font-semibold">
                {status.days_until_next} gün → {nextMilestone}g (+{status.next_reward}pt)
              </span>
              <span>{nextMilestone}g</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestone dots */}
        <div className="flex items-center justify-between mb-3">
          {MILESTONES.map(m => (
            <div key={m} className="flex flex-col items-center gap-0.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                streak >= m
                  ? 'bg-orange-500/25 border-orange-500/50 text-orange-300'
                  : m === nextMilestone
                  ? 'bg-white/5 border-orange-500/30 text-white/50 animate-pulse'
                  : 'bg-white/3 border-white/10 text-white/20'
              }`}>
                {m === nextMilestone ? '🎯' : streak >= m ? '✓' : m}
              </div>
            </div>
          ))}
        </div>

        {/* Claim button */}
        {status.checked_in_today ? (
          <div className="flex items-center justify-between bg-green-500/10 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-xs text-green-300 font-semibold">Bugün giriş yapıldı!</span>
            </div>
            <div className="flex items-center gap-1 text-green-400">
              <Star size={12} className="fill-green-400" />
              <span className="text-xs font-black">+{status.points_today}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={claim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95"
          >
            <Gift size={14} />
            {claiming ? 'Alınıyor...' : 'Günlük Ödülü Al'}
          </button>
        )}
      </div>
    </div>
  )
}
