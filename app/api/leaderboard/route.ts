import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import type { LeaderboardPeriod } from '@/types'

export async function GET(req: Request) {
  try {
    const supabase = createApiClient()
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') ?? 'weekly') as LeaderboardPeriod

    const { data: { user } } = await supabase.auth.getUser()

    // Get top 100 profiles ordered by the relevant points column
    const pointsColumn = period === 'all_time' ? 'total_points' : 'weekly_points'

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_points, weekly_points, personality_type')
      .eq('is_admin', false)
      .eq('is_banned', false)
      .order(pointsColumn, { ascending: false })
      .limit(100)

    if (!profiles) return NextResponse.json({ entries: [], myEntry: null })

    // Get win/duel counts for each profile
    const entries = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profiles.map(async (p: any, i: number) => {
        const [{ count: duelCount }, { count: winCount }] = await Promise.all([
          supabase.from('duels').select('*', { count: 'exact', head: true })
            .or(`challenger_id.eq.${p.id},challenged_id.eq.${p.id}`)
            .eq('status', 'completed'),
          supabase.from('duels').select('*', { count: 'exact', head: true })
            .eq('winner_id', p.id),
        ])
        return {
          rank: i + 1,
          ...p,
          points: period === 'all_time' ? p.total_points : p.weekly_points,
          duel_count: duelCount ?? 0,
          win_count: winCount ?? 0,
        }
      })
    )

    // My entry
    let myEntry = null
    if (user) {
      const myIdx = entries.findIndex(e => e.id === user.id)
      if (myIdx >= 0) {
        myEntry = entries[myIdx]
      } else {
        // User not in top 100, find their rank
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, total_points, weekly_points')
          .eq('id', user.id)
          .single()

        if (myProfile) {
          const myPoints = period === 'all_time' ? myProfile.total_points : myProfile.weekly_points
          const { count: aboveMe } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', false)
            .eq('is_banned', false)
            .gt(pointsColumn, myPoints ?? 0)

          myEntry = {
            rank: (aboveMe ?? 0) + 1,
            ...myProfile,
            points: myPoints,
            duel_count: 0,
            win_count: 0,
          }
        }
      }
    }

    return NextResponse.json({ entries, myEntry })
  } catch (_err) {
    return NextResponse.json({ error: 'Liderlik tablosu yüklenemedi.' }, { status: 500 })
  }
}
