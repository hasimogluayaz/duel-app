import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

const EDIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_EDITS = 3

/**
 * PATCH /api/answer/edit
 * { answer_id, content }
 */
export const PATCH = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ answer_id?: unknown; content?: unknown }>(req)
  const answerId = String(body.answer_id ?? '')
  const content  = String(body.content ?? '').trim()

  if (!answerId) throw new ApiError('answer_id gerekli.', 400, 'VALIDATION')
  if (!content || content.length < 10) throw new ApiError('En az 10 karakter gerekli.', 400, 'VALIDATION')
  if (content.length > 500) throw new ApiError('En fazla 500 karakter.', 400, 'VALIDATION')

  const { data: answer } = await supabase
    .from('answers')
    .select('id, user_id, content, created_at, edit_count')
    .eq('id', answerId)
    .single()

  if (!answer) throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')
  if ((answer as any).user_id !== userId) throw new ApiError('Bu cevap sana ait değil.', 403, 'FORBIDDEN')

  // Time window check
  const createdAt = new Date((answer as any).created_at).getTime()
  if (Date.now() - createdAt > EDIT_WINDOW_MS) {
    throw new ApiError('Cevabı sadece ilk 1 saat içinde düzenleyebilirsin.', 400, 'EDIT_WINDOW_EXPIRED')
  }

  // Max edits check
  if ((answer as any).edit_count >= MAX_EDITS) {
    throw new ApiError(`Bir cevabı en fazla ${MAX_EDITS} kez düzenleyebilirsin.`, 400, 'MAX_EDITS')
  }

  const { data: updated } = await supabase
    .from('answers')
    .update({
      content,
      edited_at: new Date().toISOString(),
      edit_count: ((answer as any).edit_count ?? 0) + 1,
    } as any)
    .eq('id', answerId)
    .select()
    .single()

  return NextResponse.json({ answer: updated })
})
