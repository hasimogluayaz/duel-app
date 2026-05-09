import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q    = (searchParams.get('q') ?? '').trim()
  const type = searchParams.get('type') ?? 'users'

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], scenarios: [] })
  }

  const supabase = createApiClient()

  if (type === 'users') {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_points, follower_count')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .eq('is_banned', false)
      .order('follower_count', { ascending: false })
      .limit(20)

    return NextResponse.json({ users: users ?? [] })
  }

  if (type === 'scenarios') {
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id, content, category, answer_count, difficulty')
      .ilike('content', `%${q}%`)
      .eq('is_approved', true)
      .order('answer_count', { ascending: false })
      .limit(20)

    return NextResponse.json({ scenarios: scenarios ?? [] })
  }

  return NextResponse.json({ users: [], scenarios: [] })
}
