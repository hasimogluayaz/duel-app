import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * GET /api/karar-ver?scenario_id=...
 * Returns 2 random answers the user hasn't already judged.
 * Works without auth (for preview), skips already-judged pairs if authed.
 */
export const GET = optionalAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const url = new URL(req.url)
  const scenarioId = url.searchParams.get('scenario_id')

  // If no specific scenario, pick today's or a random popular one
  let resolvedScenarioId = scenarioId
  if (!resolvedScenarioId) {
    const today = new Date().toISOString().split('T')[0]
    const { data: todayScenario } = await supabase
      .from('scenarios').select('id').eq('active_date', today).maybeSingle()
    if (todayScenario) {
      resolvedScenarioId = todayScenario.id
    } else {
      const { data: popular } = await supabase
        .from('scenarios').select('id').eq('is_approved', true)
        .order('answer_count', { ascending: false }).limit(10)
      if (popular?.length) {
        resolvedScenarioId = popular[Math.floor(Math.random() * popular.length)].id
      }
    }
  }

  if (!resolvedScenarioId) {
    throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')
  }

  // Get answers for this scenario (exclude user's own answer)
  let query = supabase
    .from('answers')
    .select('id, content, vote_count, verdict_count, user_id, author:profiles!answers_user_id_fkey(username, display_name, avatar_url)')
    .eq('scenario_id', resolvedScenarioId)

  if (userId) query = query.neq('user_id', userId)

  const { data: allAnswers } = await query.order('created_at', { ascending: false }).limit(50)

  if (!allAnswers || allAnswers.length < 2) {
    return NextResponse.json({ pair: null, scenario_id: resolvedScenarioId, message: 'Yeterli cevap yok.' })
  }

  // Get already-judged pairs to exclude
  const judgedIds: string[] = []
  if (userId) {
    const { data: judged } = await supabase
      .from('answer_verdicts')
      .select('winner_id, loser_id')
      .eq('voter_id', userId)
      .eq('scenario_id', resolvedScenarioId)
    judged?.forEach((j: any) => { judgedIds.push(j.winner_id, j.loser_id) })
  }

  // Filter out already judged answers (by frequency — if both seen in a pair, skip)
  const unjudged = allAnswers.filter((a: any) => !judgedIds.includes(a.id))

  // Need at least 2 unjudged
  const pool = unjudged.length >= 2 ? unjudged : allAnswers
  if (pool.length < 2) {
    return NextResponse.json({ pair: null, scenario_id: resolvedScenarioId, message: 'Tüm cevapları gördün!' })
  }

  // Pick 2 random from pool
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const [a, b] = shuffled

  // Get scenario content
  const { data: scenario } = await supabase
    .from('scenarios').select('id, content, category').eq('id', resolvedScenarioId).single()

  return NextResponse.json({
    pair: [a, b],
    scenario,
    remaining: Math.max(0, unjudged.length - 2),
  })
})

/**
 * POST /api/karar-ver
 * { scenario_id, winner_id, loser_id }
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown; winner_id?: unknown; loser_id?: unknown }>(req)

  const scenarioId = String(body.scenario_id ?? '')
  const winnerId  = String(body.winner_id  ?? '')
  const loserId   = String(body.loser_id   ?? '')

  if (!scenarioId || !winnerId || !loserId || winnerId === loserId) {
    throw new ApiError('Geçersiz veri.', 400, 'VALIDATION')
  }

  // Verify both answers belong to this scenario
  const { data: answers } = await supabase
    .from('answers').select('id, user_id')
    .in('id', [winnerId, loserId])
    .eq('scenario_id', scenarioId)

  if (!answers || answers.length < 2) {
    throw new ApiError('Cevaplar bulunamadı.', 404, 'NOT_FOUND')
  }

  // Can't vote on own answer
  if (answers.some((a: any) => a.user_id === userId)) {
    throw new ApiError('Kendi cevabına oy veremezsin.', 403, 'FORBIDDEN')
  }

  const { error } = await supabase.from('answer_verdicts').insert({
    voter_id: userId, scenario_id: scenarioId,
    winner_id: winnerId, loser_id: loserId,
  })

  if (error && error.code !== '23505') { // ignore duplicate
    throw new ApiError('Oy kaydedilemedi.', 500, 'DB_ERROR')
  }

  // Notify winner (non-blocking)
  notifyWinner(supabase, winnerId, userId).catch(() => {})

  return NextResponse.json({ success: true })
})

async function notifyWinner(supabase: any, winnerId: string, voterId: string) {
  const { data: answer } = await supabase
    .from('answers').select('user_id, verdict_count').eq('id', winnerId).single()
  if (!answer) return

  // Notify at milestones: 5, 10, 25, 50, 100
  const count = answer.verdict_count
  const milestones = [5, 10, 25, 50, 100]
  const hit = milestones.find(m => count === m)
  if (!hit) return

  await supabase.from('notifications').insert({
    user_id: answer.user_id,
    type: 'verdict_milestone',
    title: `🏆 ${hit} kişi senin cevabını seçti!`,
    message: `Cevabın "${hit}" oylamada kazandı. Harika görüş!`,
    data: { answer_id: winnerId, count: hit },
  })
}
