import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()

  // Get followed user IDs
  const { data: following } = await (supabase.from('followers' as any) as any)
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds: string[] = (following ?? []).map((f: any) => f.following_id)

  if (followingIds.length === 0) {
    return NextResponse.json({ answers: [] })
  }

  // Get recent answers from followed users, with scenario context
  const { data: answers, error } = await supabase
    .from('answers')
    .select(`
      id, content, vote_count, created_at, scenario_id,
      scenario:scenarios!answers_scenario_id_fkey(content),
      author:profiles!answers_user_id_fkey(username, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[feed/friends GET]', error)
    return NextResponse.json({ answers: [] })
  }

  const enriched = (answers ?? []).map((a: any) => ({
    id: a.id,
    content: a.content,
    vote_count: a.vote_count,
    created_at: a.created_at,
    scenario_id: a.scenario_id,
    scenario_content: a.scenario?.content ?? null,
    username: a.author?.username,
    display_name: a.author?.display_name,
    avatar_url: a.author?.avatar_url,
  }))

  return NextResponse.json({ answers: enriched })
})
