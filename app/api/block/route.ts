import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

/**
 * POST /api/block — toggle block/unblock
 * Body: { blocked_id: string }
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const { blocked_id } = await req.json()

  if (!blocked_id || typeof blocked_id !== 'string') {
    throw new ApiError('blocked_id gerekli.', 400, 'VALIDATION')
  }
  if (blocked_id === userId) {
    throw new ApiError('Kendinizi engelleyemezsiniz.', 400, 'VALIDATION')
  }

  // Check if already blocked
  const { data: existing } = await (supabase as any)
    .from('blocks')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', blocked_id)
    .maybeSingle()

  if (existing) {
    // Unblock
    await (supabase as any).from('blocks').delete().eq('id', existing.id)
    return NextResponse.json({ blocked: false })
  }

  // Block
  await (supabase as any).from('blocks').insert({ blocker_id: userId, blocked_id })

  // Also unfollow each other
  await supabase.from('follows').delete()
    .or(`and(follower_id.eq.${userId},following_id.eq.${blocked_id}),and(follower_id.eq.${blocked_id},following_id.eq.${userId})`)

  return NextResponse.json({ blocked: true })
})

/**
 * GET /api/block?user_id=xxx — check if blocked
 */
export const GET = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const url = new URL(req.url)
  const targetId = url.searchParams.get('user_id')

  if (!targetId) throw new ApiError('user_id gerekli.', 400, 'VALIDATION')

  const { data } = await (supabase as any)
    .from('blocks')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', targetId)
    .maybeSingle()

  return NextResponse.json({ blocked: !!data })
})
