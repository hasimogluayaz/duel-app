import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity/log'
import { updateWeeklyMission } from '@/lib/missions/weekly'

const STREAK_REWARDS: Record<number, number> = {
  1: 5, 2: 5, 3: 15, 4: 10, 5: 10, 6: 10, 7: 100,
  14: 250, 30: 500, 60: 1000, 100: 2500,
}

function getReward(day: number): number {
  const exact = STREAK_REWARDS[day]
  if (exact) return exact
  if (day % 7 === 0) return 50  // every 7 days: 50 bonus
  return 5 // base
}

/**
 * POST /api/checkin — daily check-in
 */
export const POST = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const today = new Date().toISOString().split('T')[0]

  // Already checked in today?
  const { data: existing } = await (supabase as any)
    .from('daily_checkins')
    .select('id, points_awarded')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ already_checked_in: true, points: existing.points_awarded })
  }

  // Get current streak from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, total_points, weekly_points')
    .eq('id', userId)
    .single()

  const streakDay = ((profile as any)?.streak_count ?? 0) + 1
  const points = getReward(streakDay)

  // Insert check-in
  await (supabase as any).from('daily_checkins').insert({
    user_id: userId,
    checkin_date: today,
    streak_day: streakDay,
    points_awarded: points,
  })

  // Award points
  await supabase.from('profiles').update({
    total_points: ((profile as any)?.total_points ?? 0) + points,
    weekly_points: ((profile as any)?.weekly_points ?? 0) + points,
  } as any).eq('id', userId)

  // Milestone notification
  if (STREAK_REWARDS[streakDay]) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'streak_milestone',
      title: `🔥 ${streakDay} Günlük Seri!`,
      message: `Tebrikler! ${streakDay} günlük seriye ulaştın ve ${points} puan kazandın.`,
      data: { streak: streakDay, points },
    }).catch(() => {})
  }

  // Activity + weekly mission (fire-and-forget)
  logActivity({ supabase, userId, type: 'streak_milestone', data: { streak: streakDay, points } }).catch(() => {})
  updateWeeklyMission(supabase, userId, 'weekly_checkins').catch(() => {})

  return NextResponse.json({
    success: true,
    streak_day: streakDay,
    points_awarded: points,
    next_milestone: Object.keys(STREAK_REWARDS).map(Number).find(d => d > streakDay) ?? null,
  })
})

/**
 * GET /api/checkin — check today's status
 */
export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: checkin } = await (supabase as any)
    .from('daily_checkins')
    .select('id, points_awarded, streak_day')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count')
    .eq('id', userId)
    .single()

  const streak = (profile as any)?.streak_count ?? 0
  const nextMilestone = Object.keys(STREAK_REWARDS).map(Number).find(d => d > streak) ?? null

  return NextResponse.json({
    checked_in_today: !!checkin,
    points_today: checkin?.points_awarded ?? 0,
    streak,
    next_milestone: nextMilestone,
    next_reward: nextMilestone ? getReward(nextMilestone) : null,
    days_until_next: nextMilestone ? nextMilestone - streak : null,
  })
})
