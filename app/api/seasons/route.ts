import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { optionalAuth } from '@/lib/api/auth'

export const GET = optionalAuth(async (_req, { userId }) => {
  const supabase = createApiClient()

  const { data: season } = await (supabase as any)
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!season) return NextResponse.json({ season: null })

  // Top 10 for current season
  const { data: top } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_points, season_points, active_title')
    .eq('is_banned', false)
    .order('season_points', { ascending: false })
    .limit(10)

  // My rank
  let myRank = null
  if (userId) {
    const { data: me } = await supabase
      .from('profiles').select('season_points').eq('id', userId).single()
    const myPoints = (me as any)?.season_points ?? 0
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', false)
      .gt('season_points', myPoints)
    myRank = (count ?? 0) + 1
  }

  const daysLeft = Math.max(0, Math.ceil(
    (new Date((season as any).ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  return NextResponse.json({
    season,
    top: (top ?? []).map((p: any, i: number) => ({ rank: i + 1, ...p })),
    my_rank: myRank,
    days_left: daysLeft,
  })
})
