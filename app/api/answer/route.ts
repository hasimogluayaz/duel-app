import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody, requireUuid, validateAnswerContent } from '@/lib/api/validate'
import { POINTS } from '@/types'
import { checkQuota } from '@/lib/quota/check'
import { logActivity } from '@/lib/activity/log'
import { updateWeeklyMission } from '@/lib/missions/weekly'

export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown; content?: unknown }>(req)

  const scenarioId = requireUuid(body.scenario_id, 'Senaryo ID')
  const content = validateAnswerContent(String(body.content ?? ''))

  // Quota check — daily answer limit
  await checkQuota(supabase, userId, 'answers_per_day')

  // Verify scenario exists and is approved
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id')
    .eq('id', scenarioId)
    .eq('is_approved', true)
    .single()

  if (!scenario) {
    throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')
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

  // Update profile + missions + activity (non-critical, fire-and-forget)
  updateProfileAsync(supabase, userId).catch((e) =>
    console.error('[answer] Profile update failed:', e),
  )
  updateMissionProgress(supabase, userId, 'answer_scenario').catch(() => {})
  logActivity({ supabase, userId, type: 'answer_posted', targetId: (answer as any).id, targetType: 'answer',
    data: { scenario_id: scenarioId } }).catch(() => {})
  updateWeeklyMission(supabase, userId, 'weekly_answers').catch(() => {})

  return NextResponse.json({ answer })
})

export const DELETE = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const url = new URL(req.url)
  const answerId = url.searchParams.get('id')

  if (!answerId) throw new ApiError('Cevap ID gerekli.', 400, 'VALIDATION')

  // Verify ownership
  const { data: answer } = await supabase
    .from('answers')
    .select('id, user_id, scenario_id')
    .eq('id', answerId)
    .single()

  if (!answer) throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')
  if ((answer as any).user_id !== userId) throw new ApiError('Bu cevap size ait değil.', 403, 'FORBIDDEN')

  // Check if this answer is used in a duel
  const { count: duelCount } = await supabase
    .from('duels')
    .select('id', { count: 'exact', head: true })
    .or(`challenger_answer_id.eq.${answerId},challenged_answer_id.eq.${answerId}`)

  if ((duelCount ?? 0) > 0) {
    throw new ApiError('Bu cevap bir düelloda kullanıldığı için silinemiyor.', 409, 'CONFLICT')
  }

  const { error } = await supabase.from('answers').delete().eq('id', answerId)
  if (error) throw new ApiError('Cevap silinemedi.', 500, 'DB_ERROR')

  // Decrement answer_count on scenario
  await supabase.rpc('decrement_answer_count', { scenario_id: (answer as any).scenario_id }).catch(() => {})

  return NextResponse.json({ success: true })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateMissionProgress(supabase: any, userId: string, missionType: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const goals: Record<string, { goal: number; points: number }> = {
    answer_scenario: { goal: 1, points: 20 },
    vote_3: { goal: 3, points: 15 },
    challenge_duel: { goal: 1, points: 25 },
    create_scenario: { goal: 1, points: 30 },
    follow_user: { goal: 1, points: 10 },
  }
  const cfg = goals[missionType]
  if (!cfg) return

  const { data: existing } = await supabase
    .from('user_daily_missions')
    .select('id, progress, completed')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('mission_type', missionType)
    .maybeSingle()

  if (existing?.completed) return

  const newProgress = (existing?.progress ?? 0) + 1
  const completed = newProgress >= cfg.goal

  await supabase.from('user_daily_missions').upsert({
    user_id: userId,
    date: today,
    mission_type: missionType,
    progress: newProgress,
    completed,
    ...(completed ? { completed_at: new Date().toISOString(), points_awarded: cfg.points } : {}),
  }, { onConflict: 'user_id,date,mission_type' })

  if (completed) {
    await supabase.from('profiles')
      .update({ total_points: supabase.rpc('increment', { x: cfg.points }) })
      .eq('id', userId)
    // Use raw update instead of rpc
    const { data: p } = await supabase.from('profiles').select('total_points, weekly_points').eq('id', userId).single()
    if (p) {
      await supabase.from('profiles').update({
        total_points: (p.total_points ?? 0) + cfg.points,
        weekly_points: (p.weekly_points ?? 0) + cfg.points,
      }).eq('id', userId)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProfileAsync(supabase: any, userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, weekly_points, streak_count, last_played_at, streak_freeze_count')
    .eq('id', userId)
    .single()

  if (!profile) return

  const lastPlayed = profile.last_played_at ? new Date(profile.last_played_at) : null
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const isYesterday = lastPlayed?.toDateString() === yesterday.toDateString()
  const isToday = lastPlayed?.toDateString() === today.toDateString()
  // Missed exactly 1 day — eligible for auto-freeze
  const missedOneDay = lastPlayed?.toDateString() === twoDaysAgo.toDateString()

  const freezeCount = (profile as any).streak_freeze_count ?? 0
  const usedFreeze = missedOneDay && freezeCount > 0

  const newStreak = isYesterday
    ? (profile.streak_count ?? 0) + 1
    : isToday
      ? profile.streak_count
      : usedFreeze
        ? (profile.streak_count ?? 0) + 1  // freeze preserved streak
        : 1

  let bonusPoints = 0
  if (newStreak === 7) bonusPoints = POINTS.STREAK_7
  if (newStreak === 30) bonusPoints = POINTS.STREAK_30

  await supabase.from('profiles').update({
    total_points: (profile.total_points ?? 0) + POINTS.DAILY_ANSWER + bonusPoints,
    weekly_points: (profile.weekly_points ?? 0) + POINTS.DAILY_ANSWER + bonusPoints,
    streak_count: newStreak,
    last_played_at: today.toISOString(),
    ...(usedFreeze ? { streak_freeze_count: Math.max(freezeCount - 1, 0) } : {}),
  }).eq('id', userId)

  // Streak freeze notification
  if (usedFreeze) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'streak_reminder',
      title: '🧊 Streak Freeze Kullanıldı!',
      message: `Dün oynamadın ama serin kaldın! Sertin korundu. Kalan dondurma: ${Math.max(freezeCount - 1, 0)}`,
      data: { freeze_used: true },
    })
  }

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
