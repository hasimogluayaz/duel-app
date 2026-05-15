import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody, requireUuid } from '@/lib/api/validate'

export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ answer_id?: unknown }>(req)
  const answerId = requireUuid(body.answer_id, 'Cevap ID')

  // Verify answer exists
  const { data: answer } = await supabase
    .from('answers')
    .select('id, user_id')
    .eq('id', answerId)
    .single()

  if (!answer) {
    throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')
  }

  if (answer.user_id === userId) {
    throw new ApiError('Kendi cevabına oy veremezsin.', 403, 'FORBIDDEN')
  }

  // Check if user already voted
  const { data: existing } = await supabase
    .from('answer_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('answer_id', answerId)
    .maybeSingle()

  if (existing) {
    // Toggle off: remove the vote
    const { error } = await supabase
      .from('answer_likes')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('[vote POST] delete', error)
      throw new ApiError('Oy kaldırılamadı.', 500, 'DB_ERROR')
    }

    // Decrement vote_count manually (trigger only handles INSERT)
    await supabase.rpc('decrement_answer_vote_count', { aid: answerId }).catch(() => {})

    return NextResponse.json({ toggled: 'off' })
  }

  // Insert new vote
  const { error } = await supabase
    .from('answer_likes')
    .insert({ user_id: userId, answer_id: answerId })

  if (error) {
    if (error.code === '23505') {
      // Race condition: already liked
      return NextResponse.json({ toggled: 'on', already_liked: true })
    }
    console.error('[vote POST]', error)
    throw new ApiError('Oy kaydedilemedi.', 500, 'DB_ERROR')
  }

  return NextResponse.json({ toggled: 'on' })
})
