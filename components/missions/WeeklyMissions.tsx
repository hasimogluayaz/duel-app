'use client'

import { useState, useEffect } from 'react'
import { Target, Clock, CheckCircle2, Star } from 'lucide-react'

interface Mission {
  type: string
  label: string
  desc: string
  target: number
  points: number
  progress: number
  completed: boolean
  completed_at: string | null
}

interface WeeklyData {
  missions: Mission[]
  completed_count: number
  total_points: number
  days_left: number
}

export default function WeeklyMissions() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/missions/weekly')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-16 bg-white/5 rounded-2xl animate-pulse" />
  if (!data) return null

  const allDone = data.completed_count === data.missions.length
  const pct = Math.round((data.completed_count / data.missions.length) * 100)

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      allDone ? 'bg-amber-500/6 border-amber-500/25' : 'bg-[#1a1a2e] border-white/10'
    }`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <Target size={15} className={allDone ? 'text-amber-400' : 'text-violet-400'} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Haftalık Görevler</span>
            <span className="text-xs text-white/40">{data.completed_count}/{data.missions.length}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-1 bg-white/8 rounded-full overflow-hidden w-full">
            <div
              className={`h-full rounded-full transition-all ${allDone ? 'bg-amber-400' : 'bg-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {data.total_points > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Star size={11} className="fill-amber-400" />
              {data.total_points}
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Clock size={10} />
            {data.days_left}g
          </div>
          <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Mission list */}
      {open && (
        <div className="border-t border-white/8 divide-y divide-white/5">
          {data.missions.map(m => {
            const progress = Math.min(m.progress, m.target)
            const pct = m.target > 0 ? Math.round((progress / m.target) * 100) : 0
            return (
              <div key={m.type} className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                m.completed ? 'opacity-60' : ''
              }`}>
                {/* Icon / check */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base ${
                  m.completed ? 'bg-green-500/20' : 'bg-white/5'
                }`}>
                  {m.completed ? <CheckCircle2 size={16} className="text-green-400" /> : m.label.split(' ')[0]}
                </div>

                {/* Text + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white/80 truncate">{m.label.split(' ').slice(1).join(' ')}</span>
                    <span className="text-[10px] text-white/30 shrink-0 ml-2">{progress}/{m.target}</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${m.completed ? 'bg-green-500' : 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className={`shrink-0 text-xs font-black flex items-center gap-1 ${
                  m.completed ? 'text-green-400' : 'text-white/30'
                }`}>
                  <Star size={10} className={m.completed ? 'fill-green-400' : ''} />
                  {m.points}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
