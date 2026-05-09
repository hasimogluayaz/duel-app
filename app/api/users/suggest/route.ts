import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'

/**
 * Returns "people you might know":
 * 1. Users followed by people you follow (2nd-degree)
 * 2. Most active users you don't follow yet
 */
export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()

  // Who does the user already follow?
  const { data: myFollows } = await (supabase.from('followers' as any) as any)
    .select('following_id').eq('follower_id', userId)
  const myFollowingIds: string[] = (myFollows ?? []).map((f: any) => f.following_id)
  const excludeIds = [...myFollowingIds, userId]

  let suggestions: any[] = []

  // 2nd-degree: people my followings follow
  if (myFollowingIds.length > 0) {
    const { data: secondDegree } = await (supabase.from('followers' as any) as any)
      .select('following_id, follower:profiles!followers_follower_id_fkey(username)')
      .in('follower_id', myFollowingIds)
      .not('following_id', 'in', `(${excludeIds.join(',')})`)
      .limit(30)

    // Count how many mutual connections each has
    const counts: Record<string, { count: number; via: string[] }> = {}
    for (const row of secondDegree ?? []) {
      const id = row.following_id
      if (!counts[id]) counts[id] = { count: 0, via: [] }
      counts[id].count++
      if (counts[id].via.length < 2) counts[id].via.push(row.follower?.username ?? '')
    }

    const topIds = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id]) => id)

    if (topIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_points, follower_count')
        .in('id', topIds)

      suggestions = (profiles ?? []).map((p: any) => ({
        ...p,
        reason: `${counts[p.id]?.via.slice(0, 2).map((u: string) => `@${u}`).join(', ')} takip ediyor`,
        mutual_count: counts[p.id]?.count ?? 0,
      }))
    }
  }

  // Fill remainder with most-followed users not already included
  if (suggestions.length < 5) {
    const alreadySuggestedIds = suggestions.map((s: any) => s.id)
    const finalExclude = [...excludeIds, ...alreadySuggestedIds]

    const { data: popular } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_points, follower_count')
      .not('id', 'in', `(${finalExclude.join(',')})`)
      .eq('is_admin', false)
      .order('follower_count', { ascending: false })
      .limit(5 - suggestions.length)

    const popularWithReason = (popular ?? []).map((p: any) => ({
      ...p,
      reason: `${p.follower_count} takipçi`,
      mutual_count: 0,
    }))
    suggestions = [...suggestions, ...popularWithReason]
  }

  return NextResponse.json({ suggestions })
})
