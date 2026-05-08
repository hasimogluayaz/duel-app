'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Mission {
  type: string
  title: string
  description: string
  goal: number
  points: number
  icon: string
  progress: number
  completed: boolean
}

interface MissionsData {
  missions: Mission[]
  totalEarned: number
  allCompleted: boolean
}

export default function DailyMissions() {
  const [data, setData] = useState<MissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/missions')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const completed = data.missions.filter((m) => m.completed).length
  const totalPoints = data.missions.reduce((sum, m) => sum + m.points, 0)

  return (
    <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎯</span>
          <div className="text-left">
            <div className="font-semibold text-sm text-white">Günlük Görevler</div>
            <div className="text-xs text-white/50">
              {completed}/{data.missions.length} tamamlandı · {data.totalEarned}/{totalPoints} puan
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.allCompleted && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Hepsi tamam!</span>
          )}
          <span className="text-white/40 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
          style={{ width: `${(completed / data.missions.length) * 100}%` }}
        />
      </div>

      {expanded && (
        <div className="p-4 space-y-2">
          {data.missions.map((mission) => (
            <MissionRow key={mission.type} mission={mission} />
          ))}
        </div>
      )}
    </div>
  )
}

function MissionRow({ mission }: { mission: Mission }) {
  const pct = mission.goal > 1 ? Math.round((mission.progress / mission.goal) * 100) : 100

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      mission.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/5'
    }`}>
      <span className="text-xl shrink-0">{mission.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${mission.completed ? 'text-green-400' : 'text-white'}`}>
            {mission.title}
          </span>
          {mission.completed && <span className="text-xs text-green-400">✓</span>}
        </div>
        <div className="text-xs text-white/40">{mission.description}</div>
        {mission.goal > 1 && !mission.completed && (
          <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${(mission.progress / mission.goal) * 100}%` }}
            />
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-bold ${mission.completed ? 'text-green-400' : 'text-white/40'}`}>
          +{mission.points}
        </div>
        {mission.goal > 1 && (
          <div className="text-xs text-white/30">{mission.progress}/{mission.goal}</div>
        )}
      </div>
    </div>
  )
}
