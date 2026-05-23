import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

const MAX_PARTICIPANTS = 4

export const POST = withAuth(async (req: Request, { userId, params }) => {
  const duelId = params?.id
  if (!duelId) throw new ApiError('Düello ID gerekli.', 400, 'MISSING_FIELD')

  const { answer_id } = await req.json() as { answer_id?: string }
  if (!answer_id) throw new ApiError('answer_id gerekli.', 400, 'MISSING_FIELD')

  const supabase = createApiClient()

  // Count current participants
  const { count } = await supabase
    .from('duel_participants')
    .select('id', { count: 'exact', head: true })
    .eq('duel_id', duelId)

  if ((count ?? 0) >= MAX_PARTICIPANTS) {
    throw new ApiError('Düello kapasitesi doldu (4/4).', 409, 'DUEL_FULL')
  }

  // Upsert — safe if user already joined
  const { error } = await supabase
    .from('duel_participants')
    .upsert(
      { duel_id: duelId, user_id: userId, answer_id },
      { onConflict: 'duel_id,user_id' }
    )

  if (error) {
    console.error('[duel/join]', error)
    throw new ApiError('Düelloya katılınamadı.', 500, 'DB_ERROR')
  }

  return NextResponse.json({ ok: true })
})
