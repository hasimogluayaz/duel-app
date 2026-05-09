import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * POST /api/duel/rematch
 * { duel_id } — request a rematch from the same opponent, same scenario
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ duel_id?: unknown }>(req)
  const duelId = String(body.duel_id ?? '')
  if (!duelId) throw new ApiError('duel_id gerekli.', 400, 'VALIDATION')

  const { data: duel } = await supabase
    .from('duels')
    .select('id, challenger_id, challenged_id, scenario_id, status, winner_id')
    .eq('id', duelId)
    .single()

  if (!duel) throw new ApiError('Düello bulunamadı.', 404, 'NOT_FOUND')
  if ((duel as any).status !== 'completed') throw new ApiError('Düello henüz bitmedi.', 400, 'NOT_COMPLETED')

  const isParticipant = (duel as any).challenger_id === userId || (duel as any).challenged_id === userId
  if (!isParticipant) throw new ApiError('Bu düelloda yer almadın.', 403, 'FORBIDDEN')

  // Mark rematch requested on original duel
  await supabase.from('duels').update({ rematch_requested_by: userId } as any).eq('id', duelId)

  const opponentId = (duel as any).challenger_id === userId
    ? (duel as any).challenged_id
    : (duel as any).challenger_id

  // Create new pending duel
  const { data: newDuel, error } = await supabase
    .from('duels')
    .insert({
      challenger_id: userId,
      challenged_id: opponentId,
      scenario_id: (duel as any).scenario_id,
      status: 'pending',
      parent_duel_id: duelId,
    } as any)
    .select('id, share_token')
    .single()

  if (error || !newDuel) throw new ApiError('Rövanş oluşturulamadı.', 500, 'DB_ERROR')

  // Notify opponent
  const { data: challenger } = await supabase
    .from('profiles').select('display_name, username').eq('id', userId).single()

  await supabase.from('notifications').insert({
    user_id: opponentId,
    type: 'rematch_request',
    title: '🔁 Rövanş İsteği!',
    message: `${(challenger as any)?.display_name || (challenger as any)?.username} rövanş istiyor!`,
    data: { duel_id: (newDuel as any).id, original_duel_id: duelId },
  }).catch(() => {})

  return NextResponse.json({ duel: newDuel }, { status: 201 })
})
