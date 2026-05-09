import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

interface Ctx { params: { id: string } }

export const GET = optionalAuth(async (_req, _auth, ctx: Ctx) => {
  const supabase = createApiClient()

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .select(`
      id, content, category, answer_count, comment_count, upvotes, generated_at,
      is_user_created, is_approved, tags, debate_question, scenario_type,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('id', ctx.params.id)
    .eq('is_approved', true)
    .single()

  if (error || !scenario) throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')
  return NextResponse.json({ scenario })
})

export const DELETE = withAuth(async (_req, { userId }, ctx: Ctx) => {
  const supabase = createApiClient()

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('user_id, is_user_created')
    .eq('id', ctx.params.id)
    .single()

  if (!scenario) throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  const isOwner = (scenario as any).user_id === userId
  const isAdmin = (profile as any)?.is_admin

  if (!isOwner && !isAdmin) throw new ApiError('Bu senaryoyu silemezsin.', 403, 'FORBIDDEN')
  if (!(scenario as any).is_user_created && !isAdmin) {
    throw new ApiError('Admin senaryoları silinemez.', 403, 'FORBIDDEN')
  }

  await supabase.from('scenarios').delete().eq('id', ctx.params.id)
  return NextResponse.json({ success: true })
})
