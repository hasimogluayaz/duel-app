/**
 * Activity feed logger — call fire-and-forget, never throws
 */

type ActivityType =
  | 'duel_won' | 'duel_lost' | 'duel_created'
  | 'answer_posted' | 'answer_voted'
  | 'followed'
  | 'streak_milestone' | 'title_earned' | 'level_up'

interface LogActivityParams {
  supabase: any
  userId: string
  type: ActivityType
  targetId?: string
  targetType?: 'duel' | 'answer' | 'profile' | 'achievement'
  data?: Record<string, unknown>
}

export async function logActivity({ supabase, userId, type, targetId, targetType, data = {} }: LogActivityParams): Promise<void> {
  try {
    await supabase.from('activity_feed').insert({
      user_id: userId,
      type,
      target_id: targetId ?? null,
      target_type: targetType ?? null,
      meta: data,
    })
  } catch {
    // Fire-and-forget — never fail the main action
  }
}

/**
 * Award season points to a user
 */
export async function awardSeasonPoints(supabase: any, userId: string, points: number): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('season_points')
      .eq('id', userId)
      .single()
    const current = (profile as any)?.season_points ?? 0
    await supabase
      .from('profiles')
      .update({ season_points: current + points } as any)
      .eq('id', userId)
  } catch {
    // Fire-and-forget
  }
}
