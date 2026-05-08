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

  const { error } = await supabase
    .from('answer_likes')
    .insert({ user_id: userId, answer_id: answerId })

  if (error) {
    if (error.code === '23505') {
      // Already liked — idempotent
      return NextResponse.json({ already_liked: true })
    }
    console.error('[vote POST]', error)
    throw new ApiError('Oy kaydedilemedi.', 500, 'DB_ERROR')
  }

  return NextResponse.json({ success: true })
})
