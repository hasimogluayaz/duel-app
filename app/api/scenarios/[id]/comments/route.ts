import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

interface Ctx { params: { id: string } }

export const GET = optionalAuth(async (req, _auth, ctx: Ctx) => {
  const supabase = createApiClient()
  const scenarioId = ctx.params.id

  const { data, error } = await (supabase as any)
    .from('scenario_comments')
    .select(`
      id, content, created_at, parent_id,
      author:profiles!scenario_comments_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('scenario_id', scenarioId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[scenario_comments GET]', error)
    return NextResponse.json({ comments: [] })
  }

  return NextResponse.json({ comments: data ?? [] })
})

export const POST = withAuth(async (req, { userId }, ctx: Ctx) => {
  const supabase = createApiClient()
  const scenarioId = ctx.params.id
  const body = await parseBody<{ content?: unknown; parent_id?: unknown }>(req)

  const content = String(body.content ?? '').trim()
  if (!content || content.length < 1) throw new ApiError('Yorum boş olamaz.', 400, 'VALIDATION')
  if (content.length > 500) throw new ApiError('Yorum en fazla 500 karakter olabilir.', 400, 'VALIDATION')

  const parentId = body.parent_id ? String(body.parent_id) : null

  const { data: comment, error } = await (supabase as any)
    .from('scenario_comments')
    .insert({
      scenario_id: scenarioId,
      user_id: userId,
      content,
      parent_id: parentId,
    })
    .select(`
      id, content, created_at, parent_id,
      author:profiles!scenario_comments_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .single()

  if (error || !comment) {
    console.error('[scenario_comments POST]', error)
    throw new ApiError('Yorum gönderilemedi.', 500, 'DB_ERROR')
  }

  return NextResponse.json({ comment }, { status: 201 })
})

export const DELETE = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('comment_id')
  if (!commentId) throw new ApiError('comment_id gerekli.', 400, 'VALIDATION')

  const { error } = await (supabase as any)
    .from('scenario_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw new ApiError('Yorum silinemedi.', 500, 'DB_ERROR')
  return NextResponse.json({ success: true })
})
