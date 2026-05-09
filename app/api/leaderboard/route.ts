import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import type { LeaderboardPeriod } from '@/types'

type ExtendedPeriod = LeaderboardPeriod | 'monthly' | 'friends'

export async function GET(req: Request) {
  try {
    const supabase = createApiClient()
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') ?? 'weekly') as ExtendedPeriod

    const { data: { user } } = await supabase.auth.getUser()

    // Monthly: approximate by using weekly_points * 4 (no separate column yet)
    // Friends: only show profiles the current user follows
    const pointsColumn = period === 'all_time' ? 'total_points' : 'weekly_points'

    // Friends leaderboard
    if (period === 'friends') {
      if (!user) return NextResponse.json({ entries: [], myEntry: null })
      const { data: following } = await (supabase.from('followers' as any) as any)
        .select('following_id')
        .eq('follower_id', user.id)
      const ids = [(following ?? []).map((f: any) => f.following_id), user.id].flat()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_points, weekly_points, personality_type, active_title')
        .in('id', ids)
        .order('total_points', { ascending: false })
        .limit(50)
      const entries = (profiles ?? []).map((p: any, i: number) => ({
        rank: i + 1, ...p,
        points: p.total_points,
        duel_count: 0, win_count: 0,
        is_me: p.id === user.id,
      }))
      const myEntry = entries.find((e: any) => e.id === user.id) ?? null
      return NextResponse.json({ entries, myEntry })
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_points, weekly_points, personality_type, active_title')
      .eq('is_admin', false)
      .eq('is_banned', false)
      .order(pointsColumn, { ascending: false })
      .limit(100)

    if (!profiles) return NextResponse.json({ entries: [], myEntry: null })

    const profileIds = profiles.map((p: any) => p.id)

    // Fetch all duel counts in 2 queries instead of 200
    const [{ data: completedDuels }, { data: winData }] = await Promise.all([
      supabase
        .from('duels')
        .select('challenger_id, challenged_id')
        .eq('status', 'completed')
        .or(`challenger_id.in.(${profileIds.join(',')}),challenged_id.in.(${profileIds.join(',')})`),
      supabase
        .from('duels')
        .select('winner_id')
        .eq('status', 'completed')
        .in('winner_id', profileIds),
    ])

    const duelCountMap: Record<string, number> = {}
    const winCountMap: Record<string, number> = {}

    for (const d of completedDuels ?? []) {
      duelCountMap[d.challenger_id] = (duelCountMap[d.challenger_id] ?? 0) + 1
      duelCountMap[d.challenged_id] = (duelCountMap[d.challenged_id] ?? 0) + 1
    }
    for (const d of winData ?? []) {
      winCountMap[d.winner_id] = (winCountMap[d.winner_id] ?? 0) + 1
    }

    const entries = profiles.map((p: any, i: number) => ({
      rank: i + 1,
      ...p,
      points: period === 'all_time' ? p.total_points : p.weekly_points,
      duel_count: duelCountMap[p.id] ?? 0,
      win_count: winCountMap[p.id] ?? 0,
    }))

    // My entry
    let myEntry = null
    if (user) {
      const myIdx = entries.findIndex((e: any) => e.id === user.id)
      if (myIdx >= 0) {
        myEntry = entries[myIdx]
      } else {
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
