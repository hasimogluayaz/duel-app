import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * POST /api/scenarios/upvote
 * { scenario_id } — toggle upvote on a user-submitted scenario
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown }>(req)
  const scenarioId = String(body.scenario_id ?? '')
  if (!scenarioId) throw new ApiError('scenario_id gerekli.', 400, 'VALIDATION')

  // Check exists + is user created
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id, user_id, upvote_count')
    .eq('id', scenarioId)
    .single()
  if (!scenario) throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')

  // Can't upvote own scenario
  if ((scenario as any).user_id === userId) {
    throw new ApiError('Kendi senaryonu oylayamazsın.', 403, 'FORBIDDEN')
  }

  // Toggle
  const { data: existing } = await (supabase as any)
    .from('scenario_upvotes')
    .select('id')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .maybeSingle()

  if (existing) {
    await (supabase as any).from('scenario_upvotes').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed', upvote_count: Math.max(0, (scenario as any).upvote_count - 1) })
  }

  await (supabase as any).from('scenario_upvotes').insert({ user_id: userId, scenario_id: scenarioId })

  // Notify scenario author if milestone
  const newCount = (scenario as any).upvote_count + 1
  if ([10, 25, 50, 100].includes(newCount) && (scenario as any).user_id) {
    await supabase.from('notifications').insert({
      user_id: (scenario as any).user_id,
      type: 'scenario_milestone',
      title: `🎉 Senaryonu ${newCount} kişi beğendi!`,
      message: 'Senaryonun topluluk tarafından çok beğenildi.',
      data: { scenario_id: scenarioId, count: newCount },
    }).catch(() => {})
  }

  return NextResponse.json({ action: 'added', upvote_count: newCount })
})
