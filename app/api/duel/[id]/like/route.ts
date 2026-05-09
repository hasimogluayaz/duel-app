import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/duel/[id]/like  — toggle like (like if not liked, unlike if liked)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın.' }, { status: 401 })

  const duelId = params.id

  // Check if already liked
  const { data: existing } = await supabase
    .from('duel_likes')
    .select('id')
    .eq('duel_id', duelId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Unlike
    await supabase
      .from('duel_likes')
      .delete()
      .eq('duel_id', duelId)
      .eq('user_id', user.id)

    const { count } = await supabase
      .from('duel_likes')
      .select('*', { count: 'exact', head: true })
      .eq('duel_id', duelId)

    return NextResponse.json({ liked: false, like_count: count ?? 0 })
  } else {
    // Like
    const { error } = await supabase
      .from('duel_likes')
      .insert({ duel_id: duelId, user_id: user.id })

    if (error?.code === '23505') {
      // Race condition — already liked
      const { count } = await supabase
        .from('duel_likes')
        .select('*', { count: 'exact', head: true })
        .eq('duel_id', duelId)
      return NextResponse.json({ liked: true, like_count: count ?? 0 })
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { count } = await supabase
      .from('duel_likes')
      .select('*', { count: 'exact', head: true })
      .eq('duel_id', duelId)

    return NextResponse.json({ liked: true, like_count: count ?? 0 })
  }
}
