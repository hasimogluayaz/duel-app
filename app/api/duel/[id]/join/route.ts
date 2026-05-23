import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

const MAX_PARTICIPANTS = 4

export const POST = optionalAuth(async (req: Request, { userId, params }) => {
  const duelId = params?.id
  if (!duelId) throw new ApiError('Düello ID gerekli.', 400, 'MISSING_FIELD')

  const { answer_id } = await req.json() as { answer_id?: string }
  if (!answer_id) throw new ApiError('answer_id gerekli.', 400, 'MISSING_FIELD')

  const supabase = createApiClient()

  // Capacity check
  const { count } = await supabase
    .from('duel_participants')
    .select('id', { count: 'exact', head: true })
    .eq('duel_id', duelId)

  if ((count ?? 0) >= MAX_PARTICIPANTS) {
    throw new ApiError('Düello kapasitesi doldu (4/4).', 409, 'DUEL_FULL')
  }

  if (userId) {
    // Authenticated: upsert on (duel_id, user_id) so re-submit is idempotent
    const { error } = await supabase
      .from('duel_participants')
      .upsert(
        { duel_id: duelId, user_id: userId, answer_id },
        { onConflict: 'duel_id,user_id' }
      )

    if (error) {
      console.error('[duel/join auth]', error)
      throw new ApiError('Düelloya katılınamadı.', 500, 'DB_ERROR')
    }
  } else {
    // Anonymous: needs migration 034 (RLS allowing user_id IS NULL inserts).
    // Dedupe by answer_id so the same answer can't be inserted twice.
    const { data: existing } = await supabase
      .from('duel_participants')
      .select('id')
      .eq('duel_id', duelId)
      .eq('answer_id', answer_id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('duel_participants')
        .insert({ duel_id: duelId, user_id: null, answer_id } as any)

      if (error) {
        console.error('[duel/join anon]', error)
        throw new ApiError(`Düelloya katılınamadı (${error.message}).`, 500, 'DB_ERROR')
      }
    }
  }

  return NextResponse.json({ ok: true })
})
