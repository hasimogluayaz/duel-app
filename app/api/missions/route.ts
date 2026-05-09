import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'
import { MISSIONS } from '@/lib/missions/config'

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: progress, error } = await supabase
    .from('user_daily_missions')
    .select('mission_type, progress, completed, completed_at, points_awarded')
    .eq('user_id', userId)
    .eq('date', today)

  if (error) {
    console.error('[missions GET]', error)
    throw new ApiError('Görevler yüklenemedi.', 500, 'DB_ERROR')
  }

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p: any) => [p.mission_type, p])
  )

  const missions = MISSIONS.map((m) => ({
    ...m,
    progress: progressMap[m.type]?.progress ?? 0,
    completed: progressMap[m.type]?.completed ?? false,
    completed_at: progressMap[m.type]?.completed_at ?? null,
    points_awarded: progressMap[m.type]?.points_awarded ?? 0,
  }))

  const totalEarned = missions.filter((m) => m.completed).reduce((sum, m) => sum + m.points, 0)
  const allCompleted = missions.every((m) => m.completed)

  return NextResponse.json({ missions, totalEarned, allCompleted, date: today })
})

export const PATCH = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ mission_type?: unknown }>(req)
  const missionType = String(body.mission_type ?? '')

  const mission = MISSIONS.find((m) => m.type === missionType)
  if (!mission) {
    throw new ApiError('Geçersiz görev türü.', 400, 'VALIDATION')
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('user_daily_missions')
    .select('id, progress, completed')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('mission_type', missionType)
    .maybeSingle()

  if (existing?.completed) {
    return NextResponse.json({ already_completed: true })
  }

  const newProgress = Math.min((existing?.progress ?? 0) + 1, mission.goal)
  const completed = newProgress >= mission.goal

  const { error } = await supabase
    .from('user_daily_missions')
    .upsert({
      user_id: userId,
      date: today,
      mission_type: missionType,
      progress: newProgress,
      completed,
      ...(completed ? {
        completed_at: new Date().toISOString(),
        points_awarded: mission.points,
      } : {}),
    }, { onConflict: 'user_id,date,mission_type' })

  if (error) {
    console.error('[missions PATCH]', error)
    throw new ApiError('Görev güncellenemedi.', 500, 'DB_ERROR')
  }

  if (completed) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, weekly_points')
      .eq('id', userId)
      .single()
    if (profile) {
      await supabase.from('profiles').update({
        total_points: (profile.total_points ?? 0) + mission.points,
        weekly_points: (profile.weekly_points ?? 0) + mission.points,
      }).eq('id', userId)
    }
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'mission_complete',
      title: `${mission.icon} Görev Tamamlandı!`,
      message: `"${mission.title}" görevi tamamlandı. +${mission.points} puan kazandın!`,
      data: { mission_type: missionType },
    })
  }

  return NextResponse.json({ progress: newProgress, completed, points_awarded: completed ? mission.points : 0 })
})
