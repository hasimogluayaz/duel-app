import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

const MAX_PINNED = 3

/**
 * POST /api/profile/pin
 * { answer_id, action: 'pin' | 'unpin' }
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ answer_id?: unknown; action?: unknown }>(req)

  const answerId = String(body.answer_id ?? '')
  const action   = String(body.action ?? 'pin') as 'pin' | 'unpin'

  if (!answerId) throw new ApiError('Cevap ID gerekli.', 400, 'VALIDATION')

  // Verify answer belongs to user
  const { data: answer } = await supabase
    .from('answers').select('id').eq('id', answerId).eq('user_id', userId).single()
  if (!answer) throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')

  // Get current pinned
  const { data: profile } = await supabase
    .from('profiles').select('pinned_answer_ids').eq('id', userId).single()
  const current: string[] = (profile as any)?.pinned_answer_ids ?? []

  let updated: string[]
  if (action === 'pin') {
    if (current.includes(answerId)) return NextResponse.json({ pinned: current })
    if (current.length >= MAX_PINNED) {
      throw new ApiError(`En fazla ${MAX_PINNED} cevap sabitleyebilirsin.`, 400, 'LIMIT_EXCEEDED')
    }
    updated = [...current, answerId]
  } else {
    updated = current.filter(id => id !== answerId)
  }

  await supabase.from('profiles').update({ pinned_answer_ids: updated }).eq('id', userId)

  return NextResponse.json({ pinned: updated })
})
