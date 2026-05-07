import { POINTS } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addPoints(supabase: any, userId: string, points: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, weekly_points')
    .eq('id', userId)
    .single()

  if (!profile) return

  await supabase.from('profiles').update({
    total_points: (profile.total_points || 0) + points,
    weekly_points: (profile.weekly_points || 0) + points,
  }).eq('id', userId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAndAwardStreak(supabase: any, userId: string, streakCount: number) {
  if (streakCount === 7) {
    await addPoints(supabase, userId, POINTS.STREAK_7)
    await supabase.from('achievements').insert({
      user_id: userId, type: 'streak_7',
    })
  }
  if (streakCount === 30) {
    await addPoints(supabase, userId, POINTS.STREAK_30)
    await supabase.from('achievements').insert({
      user_id: userId, type: 'streak_30',
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRoastMaster(supabase: any, userId: string) {
  const { count } = await supabase
    .from('duels')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', userId)

  if (count === 10) {
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'roast_master')
      .single()

    if (!existing) {
      await supabase.from('achievements').insert({ user_id: userId, type: 'roast_master' })
    }
  }
}
