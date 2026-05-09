import { createApiClient, createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

export const POST = withAuth(async (_req, { userId, params }) => {
  const duelId = params?.id
  if (!duelId) throw new ApiError('Düello ID gerekli.', 400, 'VALIDATION')

  const supabase = createApiClient()

  const { data: duel, error: fetchErr } = await supabase
    .from('duels')
    .select('id, status, challenger_id, challenged_id')
    .eq('id', duelId)
    .maybeSingle()

  if (fetchErr) throw new ApiError('Düello sorgulanamadı.', 500, 'SERVER_ERROR')
  if (!duel) throw new ApiError('Düello bulunamadı.', 404, 'NOT_FOUND')
  if ((duel as any).status !== 'pending') {
    throw new ApiError('Sadece bekleyen düellolar iptal edilebilir.', 400, 'BAD_REQUEST')
  }
  if ((duel as any).challenger_id !== userId) {
    throw new ApiError('Sadece daveti gönderen kişi iptal edebilir.', 403, 'FORBIDDEN')
  }

  // Use service client to bypass RLS for delete
  const service = createServiceClient()
  const { error: deleteErr } = await service.from('duels').delete().eq('id', duelId)
  if (deleteErr) throw new ApiError('Düello iptal edilemedi.', 500, 'SERVER_ERROR')

  // Notify challenged user (if exists)
  const challengedId = (duel as any).challenged_id
  if (challengedId) {
    await service.from('notifications').insert({
      user_id: challengedId,
      type: 'duel_result',
      title: '⚔️ Düello İptal Edildi',
      message: 'Gönderilen düello daveti iptal edildi.',
      data: { duel_id: duelId },
    } as any).catch(() => {})
  }

  return NextResponse.json({ success: true })
})
