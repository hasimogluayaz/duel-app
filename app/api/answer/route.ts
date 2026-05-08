import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody, requireUuid, validateAnswerContent } from '@/lib/api/validate'
import { POINTS } from '@/types'

export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown; content?: unknown }>(req)

  const scenarioId = requireUuid(body.scenario_id, 'Senaryo ID')
  const content = validateAnswerContent(String(body.content ?? ''))

  // Verify scenario exists and is active today
  const today = new Date().toISOString().split('T')[0]
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id')
    .eq('active_date', today)
    .eq('id', scenarioId)
    .single()

  if (!scenario) {
    throw new ApiError('Senaryo bulunamadı veya bugün aktif değil.', 404, 'NOT_FOUND')
  }

  // Check if already answered (idempotent — return existing answer)
  const { data: existing } = await supabase
    .from('answers')
    .select('*')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .single()

  if (existing) {
    return NextResponse.json({ answer: existing })
  }

  // Insert answer
  const { data: answer, error: insertError } = await supabase
    .from('answers')
    .insert({ user_id: userId, scenario_id: scenarioId, content })
    .select()
    .single()

  if (insertError || !answer) {
    console.error('[answer] Insert failed:', insertError)
    throw new ApiError('Cevap kaydedilemedi.', 500, 'DB_ERROR')
  }

  // Update profile: points + streak (non-critical, fire-and-forget)
  updateProfileAsync(supabase, userId).catch((e) =>
    console.error('[answer] Profile update failed:', e),
  )

  return NextResponse.json({ answer })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProfileAsync(supabase: any, userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, weekly_points, streak_count, last_played_at')
    .eq('id', userId)
    .single()

  if (!profile) return

  const lastPlayed = profile.last_played_at ? new Date(profile.last_played_at) : null
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isYesterday = lastPlayed?.toDateString() === yesterday.toDateString()
  const isToday = lastPlayed?.toDateString() === today.toDateString()

  const newStreak = isYesterday
    ? (profile.streak_count ?? 0) + 1
    : isToday
      ? profile.streak_count
      : 1

  let bonusPoints = 0
  if (newStreak === 7) bonusPoints = POINTS.STREAK_7
  if (newStreak === 30) bonusPoints = POINTS.STREAK_30

  await supabase.from('profiles').update({
    total_points: (profile.total_points ?? 0) + POINTS.DAILY_ANSWER + bonusPoints,
    weekly_points: (profile.weekly_points ?? 0) + POINTS.DAILY_ANSWER + bonusPoints,
    streak_count: newStreak,
    last_played_at: today.toISOString(),
  }).eq('id', userId)

  // Streak achievements
  if (newStreak === 7 || newStreak === 30) {
    const type = newStreak === 7 ? 'streak_7' : 'streak_30'
    await supabase.from('achievements').upsert({
      user_id: userId, type, earned_at: new Date().toISOString(),
    })
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'streak_reminder',
      title: newStreak === 7 ? '🔥 7 Günlük Seri!' : '👑 30 Günlük Şampiyon!',
      message: newStreak === 7
        ? 'Tebrikler! 7 gün üst üste oynadın. +100 puan kazandın!'
        : 'İnanılmaz! 30 gün üst üste oynadın. +500 puan kazandın!',
      data: {},
    })
  }
}
