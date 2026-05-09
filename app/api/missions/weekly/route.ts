import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'

const WEEKLY_MISSION_DEFS = [
  { type: 'weekly_duels',    label: '⚔️ Haftalık Düello',   desc: '5 düello tamamla',        target: 5,  points: 150 },
  { type: 'weekly_wins',     label: '🏆 Galipler Yolu',     desc: '3 düello kazan',           target: 3,  points: 200 },
  { type: 'weekly_answers',  label: '📝 Cevap Ustası',      desc: '10 senaryo cevapla',       target: 10, points: 100 },
  { type: 'weekly_votes',    label: '⭐ Popüler Cevap',     desc: '20 oy topla',              target: 20, points: 120 },
  { type: 'weekly_checkins', label: '🔥 Seri Koruyucu',     desc: '5 gün üst üste giriş yap', target: 5,  points: 180 },
]

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()

  // Week start = Monday of current week
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diff)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Get or create weekly missions
  const { data: existing } = await (supabase as any)
    .from('weekly_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStartStr)

  const existingMap = Object.fromEntries((existing ?? []).map((m: any) => [m.type, m]))

  // Upsert missing missions
  const toCreate = WEEKLY_MISSION_DEFS.filter(d => !existingMap[d.type])
  if (toCreate.length > 0) {
    await (supabase as any).from('weekly_missions').insert(
      toCreate.map(d => ({
        user_id: userId,
        week_start: weekStartStr,
        type: d.type,
        target: d.target,
        progress: 0,
        completed: false,
        points_reward: d.points,
      }))
    )
  }

  // Re-fetch
  const { data: missions } = await (supabase as any)
    .from('weekly_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStartStr)

  const enriched = WEEKLY_MISSION_DEFS.map(def => {
    const row = (missions ?? []).find((m: any) => m.type === def.type) ?? {}
    return {
      ...def,
      progress: row.progress ?? 0,
      completed: row.completed ?? false,
      completed_at: row.completed_at ?? null,
    }
  })

  const completedCount = enriched.filter(m => m.completed).length
  const totalPoints = enriched.filter(m => m.completed).reduce((s, m) => s + m.points, 0)

  // Days until next Monday
  const daysLeft = 7 - ((now.getDay() + 6) % 7)

  return NextResponse.json({
    missions: enriched,
    completed_count: completedCount,
    total_points: totalPoints,
    week_start: weekStartStr,
    days_left: daysLeft,
  })
})
