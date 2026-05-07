import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)

  const supabase = createClient()

  if (!q || q.length < 2) {
    // Return top players by total_points as default discovery
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, total_points, streak_count, personality_type, is_admin, is_banned, weekly_points, last_played_at, personality_updated_at, created_at')
      .eq('is_banned', false)
      .eq('is_admin', false)
      .order('total_points', { ascending: false })
      .limit(limit)
    return NextResponse.json({ users: data ?? [], query: q })
  }

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, total_points, streak_count, personality_type, is_admin, is_banned, weekly_points, last_played_at, personality_updated_at, created_at')
    .eq('is_banned', false)
    .eq('is_admin', false)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .order('total_points', { ascending: false })
    .limit(limit)

  return NextResponse.json({ users: data ?? [], query: q })
}
