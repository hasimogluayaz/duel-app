import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * GET /api/answer/comments?answer_id=xxx
 */
export const GET = optionalAuth(async (req, { userId: _uid }) => {
  const supabase = createApiClient()
  const answerId = new URL(req.url).searchParams.get('answer_id')
  if (!answerId) throw new ApiError('answer_id gerekli.', 400, 'VALIDATION')

  const { data } = await (supabase as any)
    .from('answer_comments')
    .select(`
      id, content, created_at,
      user:profiles!answer_comments_user_id_fkey(username, display_name, avatar_url, total_points)
    `)
    .eq('answer_id', answerId)
    .order('created_at', { ascending: true })
    .limit(50)

  return NextResponse.json({ comments: data ?? [] })
})

/**
 * POST /api/answer/comments
 * { answer_id, content }
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ answer_id?: unknown; content?: unknown }>(req)
  const answerId = String(body.answer_id ?? '')
  const content  = String(body.content ?? '').trim()

  if (!answerId) throw new ApiError('answer_id gerekli.', 400, 'VALIDATION')
  if (!content || content.length < 1) throw new ApiError('Yorum boş olamaz.', 400, 'VALIDATION')
  if (content.length > 300) throw new ApiError('Yorum en fazla 300 karakter.', 400, 'VALIDATION')

  const { data: comment, error } = await (supabase as any)
    .from('answer_comments')
    .insert({ user_id: userId, answer_id: answerId, content })
    .select(`
      id, content, created_at,
      user:profiles!answer_comments_user_id_fkey(username, display_name, avatar_url, total_points)
    `)
    .single()

  if (error) throw new ApiError('Yorum kaydedilemedi.', 500, 'DB_ERROR')

  // Notify answer owner
  const { data: answer } = await supabase
    .from('answers').select('user_id').eq('id', answerId).single()
  if (answer && (answer as any).user_id !== userId) {
    const { data: commenter } = await supabase
      .from('profiles').select('display_name, username').eq('id', userId).single()
    await supabase.from('notifications').insert({
      user_id: (answer as any).user_id,
      type: 'answer_comment',
      title: '💬 Cevabına yorum yapıldı',
      message: `${(commenter as any)?.display_name || (commenter as any)?.username}: "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
      data: { answer_id: answerId, comment_id: (comment as any).id },
    }).catch(() => {})
  }

  return NextResponse.json({ comment }, { status: 201 })
})

/**
 * DELETE /api/answer/comments?id=xxx
 */
export const DELETE = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) throw new ApiError('id gerekli.', 400, 'VALIDATION')

  const { data: comment } = await (supabase as any)
    .from('answer_comments').select('user_id').eq('id', id).single()
  if (!comment || (comment as any).user_id !== userId) {
    throw new ApiError('Bu yorumu silemezsin.', 403, 'FORBIDDEN')
  }

  await (supabase as any).from('answer_comments').delete().eq('id', id)
  return NextResponse.json({ success: true })
})
