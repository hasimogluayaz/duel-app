/**
 * Update weekly mission progress — fire-and-forget
 */

type WeeklyMissionType = 'weekly_duels' | 'weekly_wins' | 'weekly_answers' | 'weekly_votes' | 'weekly_checkins'

export async function updateWeeklyMission(
  supabase: any,
  userId: string,
  type: WeeklyMissionType,
  increment = 1,
): Promise<void> {
  try {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diff)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const TARGETS: Record<WeeklyMissionType, number> = {
      weekly_duels: 5,
      weekly_wins: 3,
      weekly_answers: 10,
      weekly_votes: 20,
      weekly_checkins: 5,
    }
    const target = TARGETS[type]

    const { data: existing } = await supabase
      .from('weekly_missions')
      .select('id, progress, completed, points_reward')
      .eq('user_id', userId)
      .eq('week_start', weekStartStr)
      .eq('type', type)
      .maybeSingle()

    if (existing?.completed) return

    const newProgress = Math.min((existing?.progress ?? 0) + increment, target)
    const completed = newProgress >= target

    if (existing) {
      await supabase
        .from('weekly_missions')
        .update({
          progress: newProgress,
          completed,
          ...(completed ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', existing.id)

      // Award points on completion
      if (completed && !existing.completed) {
        const pts = existing.points_reward ?? 50
        const { data: prof } = await supabase.from('profiles').select('total_points, weekly_points').eq('id', userId).single()
        if (prof) {
          await supabase.from('profiles').update({
            total_points: (prof.total_points ?? 0) + pts,
            weekly_points: (prof.weekly_points ?? 0) + pts,
          } as any).eq('id', userId)
        }
      }
    } else {
      // Create row if doesn't exist (mission was not fetched before)
      const POINTS_REWARD: Record<WeeklyMissionType, number> = {
        weekly_duels: 150, weekly_wins: 200, weekly_answers: 100, weekly_votes: 120, weekly_checkins: 180,
      }
      await supabase.from('weekly_missions').insert({
        user_id: userId,
        week_start: weekStartStr,
        type,
        target,
        progress: increment,
        completed: increment >= target,
        points_reward: POINTS_REWARD[type],
        ...(increment >= target ? { completed_at: new Date().toISOString() } : {}),
      })
    }
  } catch {
    // fire-and-forget
  }
}
