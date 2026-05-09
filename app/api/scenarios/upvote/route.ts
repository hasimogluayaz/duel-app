import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown }>(req)
  const scenarioId = String(body.scenario_id ?? '')
  if (!scenarioId) throw new ApiError('scenario_id gerekli.', 400, 'VALIDATION')

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id, user_id, upvotes')
    .eq('id', scenarioId)
    .single()
  if (!scenario) throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')

  if ((scenario as any).user_id === userId) {
    throw new ApiError('Kendi senaryonu oylayamazsın.', 403, 'FORBIDDEN')
  }

  const { data: existing } = await (supabase as any)
    .from('scenario_votes')
    .select('id, vote_type')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .maybeSingle()

  if (existing) {
    await (supabase as any).from('scenario_votes').delete().eq('id', existing.id)
    const newCount = Math.max(0, ((scenario as any).upvotes ?? 0) - 1)
    return NextResponse.json({ action: 'removed', upvotes: newCount })
  }

  await (supabase as any).from('scenario_votes').insert({ user_id: userId, scenario_id: scenarioId, vote_type: 'up' })

  const newCount = ((scenario as any).upvotes ?? 0) + 1

  if ([10, 25, 50, 100].includes(newCount) && (scenario as any).user_id) {
    await supabase.from('notifications').insert({
      user_id: (scenario as any).user_id,
      type: 'scenario_milestone',
      title: `🎉 Senaryonu ${newCount} kişi beğendi!`,
      message: 'Senaryonun topluluk tarafından çok beğenildi.',
      data: { scenario_id: scenarioId, count: newCount },
    } as any).catch(() => {})
  }

  return NextResponse.json({ action: 'added', upvotes: newCount })
})
