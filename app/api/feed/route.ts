import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'today' // today | week
  const cursor = searchParams.get('cursor') // ISO date for pagination

  const supabase = createApiClient()

  const since = period === 'week'
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(new Date().toISOString().split('T')[0]).toISOString()

  let query = (supabase as any)
    .from('duels')
    .select(`
      id, share_token, status, created_at, vote_deadline, comment_count,
      challenger_id, challenged_id, winner_id,
      challenger:profiles!duels_challenger_id_fkey(id, username, display_name, avatar_url, total_points),
      challenged:profiles!duels_challenged_id_fkey(id, username, display_name, avatar_url, total_points),
      challenger_answer:answers!duels_challenger_answer_id_fkey(content, vote_count),
      challenged_answer:answers!duels_challenged_answer_id_fkey(content, vote_count),
      scenario:scenarios(content, category, mode)
    `)
    .in('status', ['active', 'completed'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: duels, error } = await query

  if (error) return NextResponse.json({ error: 'Feed yüklenemedi.' }, { status: 500 })

  return NextResponse.json({ duels: duels ?? [] })
}
