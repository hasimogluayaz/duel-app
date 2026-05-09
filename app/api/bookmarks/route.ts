import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * GET /api/bookmarks?type=answers|scenarios
 */
export const GET = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const type = new URL(req.url).searchParams.get('type') ?? 'answers'

  if (type === 'answers') {
    const { data } = await (supabase as any)
      .from('answer_bookmarks')
      .select(`
        id, created_at,
        answer:answers!answer_bookmarks_answer_id_fkey(
          id, content, vote_count, created_at,
          user:profiles!answers_user_id_fkey(username, display_name, avatar_url),
          scenario:scenarios(id, content, category)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ bookmarks: data ?? [] })
  }

  const { data } = await (supabase as any)
    .from('scenario_bookmarks')
    .select(`
      id, created_at,
      scenario:scenarios!scenario_bookmarks_scenario_id_fkey(
        id, content, category, answer_count, difficulty
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ bookmarks: data ?? [] })
})

/**
 * POST /api/bookmarks
 * { type: 'answer'|'scenario', id } — toggle bookmark
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ type?: unknown; id?: unknown }>(req)
  const type = String(body.type ?? 'answer')
  const id   = String(body.id ?? '')
  if (!id) throw new ApiError('id gerekli.', 400, 'VALIDATION')

  const table = type === 'scenario' ? 'scenario_bookmarks' : 'answer_bookmarks'
  const field = type === 'scenario' ? 'scenario_id' : 'answer_id'

  const { data: existing } = await (supabase as any)
    .from(table).select('id').eq('user_id', userId).eq(field, id).maybeSingle()

  if (existing) {
    await (supabase as any).from(table).delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  }

  await (supabase as any).from(table).insert({ user_id: userId, [field]: id })
  return NextResponse.json({ action: 'added' })
})
