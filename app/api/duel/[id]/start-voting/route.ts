import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

export const POST = withAuth(async (_req, { userId, params }) => {
  const duelId = params?.id
  if (!duelId) throw new ApiError('Düello ID gerekli.', 400, 'MISSING_FIELD')

  const supabase = createApiClient()

  // Get duel — only creator can start voting
  const { data: duel } = await supabase
    .from('duels')
    .select('id, creator_id, judge_mode, voting_started_at')
    .eq('id', duelId)
    .single()

  if (!duel) throw new ApiError('Düello bulunamadı.', 404, 'NOT_FOUND')
  if (duel.creator_id !== userId) {
    throw new ApiError('Sadece kurucu oylamayı başlatabilir.', 403, 'FORBIDDEN')
  }
  if (duel.judge_mode === 'ai') {
    throw new ApiError('Bu düello AI modu, oylama yok.', 400, 'WRONG_MODE')
  }
  if (duel.voting_started_at) {
    throw new ApiError('Oylama zaten başladı.', 409, 'ALREADY_STARTED')
  }

  // Need at least 2 participants
  const { count } = await supabase
    .from('duel_participants')
    .select('*', { count: 'exact', head: true })
    .eq('duel_id', duelId)

  if ((count ?? 0) < 2) {
    throw new ApiError('Oylama için en az 2 katılımcı gerekli.', 400, 'NOT_ENOUGH_PARTICIPANTS')
  }

  // Start voting
  const startedAt = new Date().toISOString()
  await supabase
    .from('duels')
    .update({ voting_started_at: startedAt } as any)
    .eq('id', duelId)

  return NextResponse.json({ voting_started_at: startedAt })
})
