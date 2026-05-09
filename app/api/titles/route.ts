import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'
import { TITLE_DEFINITIONS } from '@/lib/titles/config'

/**
 * GET /api/titles — list user's earned titles
 */
export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const { data: titles } = await (supabase as any)
    .from('user_titles')
    .select('title, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_title')
    .eq('id', userId)
    .single()

  const enriched = (titles ?? []).map((t: any) => ({
    ...t,
    ...TITLE_DEFINITIONS[t.title],
  }))

  return NextResponse.json({
    titles: enriched,
    active_title: (profile as any)?.active_title ?? null,
  })
})

/**
 * POST /api/titles
 * { title } — set active title (must be earned)
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ title?: unknown }>(req)
  const title = String(body.title ?? '')

  if (title && !TITLE_DEFINITIONS[title]) {
    throw new ApiError('Geçersiz unvan.', 400, 'VALIDATION')
  }

  // Verify earned (unless clearing)
  if (title) {
    const { data: earned } = await (supabase as any)
      .from('user_titles')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle()
    if (!earned) throw new ApiError('Bu unvanı henüz kazanmadın.', 403, 'NOT_EARNED')
  }

  await supabase.from('profiles')
    .update({ active_title: title || null } as any)
    .eq('id', userId)

  return NextResponse.json({ active_title: title || null })
})
