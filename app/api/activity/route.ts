import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { optionalAuth } from '@/lib/api/auth'

/**
 * GET /api/activity?username=xxx&limit=20
 * Public activity feed for a user's profile
 */
export const GET = optionalAuth(async (req, { userId: _viewerId }) => {
  const supabase = createApiClient()
  const params = new URL(req.url).searchParams
  const username = params.get('username')
  const limit = Math.min(parseInt(params.get('limit') ?? '20'), 50)

  if (!username) return NextResponse.json({ error: 'username gerekli' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('username', username.toLowerCase()).single()

  if (!profile) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const { data: activities } = await (supabase as any)
    .from('activity_feed')
    .select('*')
    .eq('user_id', (profile as any).id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json({ activities: activities ?? [] })
})
